#!/usr/bin/env node
import assert from 'node:assert/strict';
import fs from 'node:fs';
import path from 'node:path';
import { createRequire } from 'node:module';

const require = createRequire(import.meta.url);
const { JSDOM } = require('/tmp/cgm-jsdom-test/node_modules/jsdom');
const root = path.resolve(process.cwd());

function read(relative) {
  return fs.readFileSync(path.join(root, relative), 'utf8');
}

function setupWindow(window) {
  window.matchMedia = window.matchMedia || (() => ({
    matches: false,
    addEventListener() {},
    removeEventListener() {},
    addListener() {},
    removeListener() {}
  }));
  window.scrollTo = () => {};
  window.HTMLElement.prototype.scrollIntoView = () => {};
  window.requestAnimationFrame = (callback) => window.setTimeout(() => callback(Date.now()), 0);
  window.cancelAnimationFrame = (id) => window.clearTimeout(id);
}

function domFor(relative) {
  return new JSDOM(read(relative), {
    url: 'https://jjw37.github.io/chilterngardenmaintenance-updatedsite/' + relative.replace(/index\.html$/, ''),
    runScripts: 'dangerously',
    beforeParse: setupWindow
  });
}

function runBrowserScript(window, source) {
  const script = window.document.createElement('script');
  script.textContent = source;
  window.document.head.append(script);
}

function tick(window, delay = 0) {
  return new Promise((resolve) => window.setTimeout(resolve, delay));
}

async function testHomepageArticles() {
  const dom = domFor('index.html');
  runBrowserScript(dom.window, read('js/mobile-dock.js'));
  dom.window.document.dispatchEvent(new dom.window.Event('DOMContentLoaded'));
  await tick(dom.window);
  const cards = dom.window.document.querySelectorAll('#popular-articles .article-card-popular');
  assert.equal(cards.length, 4, 'homepage should render four Popular right now cards');
  assert.equal(dom.window.document.querySelector('#popular-articles').textContent.includes('Loading articles'), false, 'homepage must not retain a loading placeholder');
  const dock = dom.window.document.querySelector('.swipe-row');
  assert.equal(dock.classList.contains('cgm-scroll-dock'), true, 'homepage quick links should initialise the enhanced scroll dock');
  assert.notEqual(dock.querySelector('.swipe-row__item').style.getPropertyValue('--dock-scale'), '', 'homepage quick links should receive live dock animation values');
  dom.window.close();
}

async function testLocationTownSelection() {
  const dom = domFor('locations/index.html');
  await tick(dom.window);
  const card = dom.window.document.querySelector('.town-card[data-slug="amersham"]');
  assert.ok(card, 'Amersham town card should exist');
  card.dispatchEvent(new dom.window.MouseEvent('click', { bubbles: true }));
  assert.equal(dom.window.document.getElementById('townSummaryName').textContent, 'Amersham', 'town selection should update Town Intelligence');
  assert.equal(dom.window.document.getElementById('townSelectionNotice').hidden, false, 'town selection should show its visible intelligence link');
  assert.equal(typeof dom.window.CGMSelectTown, 'function', 'map bridge should expose town selection');
  dom.window.close();
}

async function testPlantPostcodeTool() {
  const dom = domFor('plants/index.html');
  const towns = JSON.parse(read('_private-data/towns.json'));
  const plants = JSON.parse(read('_private-data/plants.json'));
  dom.window.fetch = (url) => Promise.resolve({
    json: () => Promise.resolve(String(url).includes('towns.json') ? towns : plants)
  });
  dom.window.eval(read('js/right-plant-tool.js'));
  await tick(dom.window);
  await tick(dom.window);
  const document = dom.window.document;
  document.getElementById('rprp-postcode').value = 'OX14 4SE';
  document.getElementById('rprpDetect').click();
  const result = document.getElementById('rprpDetectResult');
  assert.equal(result.hidden, false, 'postcode result should become visible');
  assert.match(result.textContent, /Detected:/, 'postcode checker should provide a detected area');
  dom.window.close();
}

async function testPhotoToolControls() {
  const dom = domFor('booking/index.html');
  const canvasContext = {
    drawImage() {}, beginPath() {}, moveTo() {}, lineTo() {}, stroke() {}, arcTo() {}, closePath() {}, fill() {}, fillRect() {},
    measureText() { return { width: 40 }; }, set strokeStyle(_) {}, set lineWidth(_) {}, set lineCap(_) {}, set lineJoin(_) {},
    set font(_) {}, set fillStyle(_) {}, set textBaseline(_) {}, set textAlign(_) {}, fillText() {}
  };
  dom.window.HTMLCanvasElement.prototype.getContext = () => canvasContext;
  dom.window.HTMLCanvasElement.prototype.toDataURL = () => 'data:image/jpeg;base64,AA==';
  dom.window.eval(read('js/photo-markup.js'));
  await tick(dom.window);
  const document = dom.window.document;
  const labelButton = document.querySelector('.photo-markup-tool__tool[data-tool="label"]');
  assert.ok(labelButton, 'photo label control should be created');
  labelButton.querySelector('svg').dispatchEvent(new dom.window.MouseEvent('click', { bubbles: true }));
  assert.equal(document.getElementById('labelsSection').hidden, false, 'clicking the label icon should activate the label tool');
  dom.window.close();
}

function runCalculator(relative, module, callback, resultId, expectedText) {
  const dom = domFor(relative);
  dom.window.alert = () => {
    throw new Error('Calculator unexpectedly asked for missing answers');
  };
  runBrowserScript(dom.window, read('js/calculators-core.js'));
  runBrowserScript(dom.window, read(module));
  callback(dom.window);
  const result = dom.window.document.getElementById(resultId);
  assert.equal(result.hidden, false, `${relative} should reveal its result`);
  assert.match(result.textContent, expectedText, `${relative} should calculate a meaningful result`);
  dom.window.close();
}

async function testCalculators() {
  runCalculator(
    'calculators/clearance.html',
    'js/calculators-clearance.js',
    (window) => window.calcClearance(),
    'clearance-result',
    /Level [1-4]/
  );
  runCalculator(
    'calculators/maintenance.html',
    'js/calculators-maintenance.js',
    (window) => window.calcMaintenance(),
    'maintenance-result',
    /Level [1-4]/
  );
}

await testHomepageArticles();
await testLocationTownSelection();
await testPlantPostcodeTool();
await testPhotoToolControls();
await testCalculators();
console.log('Runtime smoke checks: homepage articles, locations selection, plant postcode tool, photo controls, and calculators passed.');
