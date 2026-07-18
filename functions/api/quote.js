/**
 * CGM Quote Submission API
 * Cloudflare Pages Function
 * 
 * Handles form submissions from /booking/
 * Generates unique enquiry IDs, validates input, stores leads,
 * and sends confirmation via Resend email API.
 * 
 * Environment variables needed (set in Cloudflare Pages dashboard):
 * - RESEND_API_KEY: Resend.com API key for sending emails
 * - CGM_EMAIL_TO: hello@chilterngardenmaintenance.com
 * - CGM_EMAIL_FROM: noreply@chilterngardenmaintenance.com
 * - TURNSTILE_SECRET: Cloudflare Turnstile secret key (optional)
 */

// In-memory lead store (for demo; production should use Cloudflare D1 or KV)
// In production, replace with D1 database or external CRM webhook
const leadStore = new Map();

export async function onRequestPost({ request, env }) {
  const corsHeaders = {
    'Access-Control-Allow-Origin': '*',
    'Access-Control-Allow-Methods': 'POST, OPTIONS',
    'Access-Control-Allow-Headers': 'Content-Type',
  };

  // Handle CORS preflight
  if (request.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const contentType = request.headers.get('Content-Type') || '';

    let formData;
    let photos = [];

    if (contentType.includes('multipart/form-data')) {
      formData = await request.formData();
      // Extract regular photos
      const photoFiles = formData.getAll('photos');
      for (const file of photoFiles) {
        if (file && file.size > 0 && file.size < 10 * 1024 * 1024) { // Max 10MB per photo
          photos.push({
            name: file.name,
            size: file.size,
            type: file.type,
            kind: 'upload'
          });
        }
      }
      // Extract annotated photos (from the photo markup tool)
      const annotatedFiles = formData.getAll('annotatedPhotos');
      for (const file of annotatedFiles) {
        if (file && file.size > 0 && file.size < 10 * 1024 * 1024) { // Max 10MB per annotated photo
          photos.push({
            name: file.name,
            size: file.size,
            type: file.type,
            kind: 'annotated'
          });
        }
      }
    } else {
      // JSON fallback
      const json = await request.json();
      formData = new FormData();
      for (const [key, value] of Object.entries(json)) {
        formData.append(key, value);
      }
    }

    // Extract form fields
    const name = (formData.get('name') || '').toString().trim();
    const phone = (formData.get('phone') || '').toString().trim();
    const email = (formData.get('email') || '').toString().trim();
    const postcode = (formData.get('postcode') || '').toString().trim().toUpperCase();
    const service = (formData.get('service') || '').toString().trim();
    const when = (formData.get('when') || '').toString().trim();
    const details = (formData.get('details') || '').toString().trim();
    const preferredContact = (formData.get('preferredContact') || 'phone').toString().trim();
    const sourcePage = (formData.get('sourcePage') || '').toString().trim();
    const calculatorData = (formData.get('calculatorData') || '').toString().trim();
    const consent = formData.get('consent') === 'true' || formData.get('consent') === 'on';

    // Validation
    const errors = [];

    if (!name || name.length < 2) {
      errors.push({ field: 'name', message: 'Name is required' });
    }
    if (!phone || phone.length < 7) {
      errors.push({ field: 'phone', message: 'Valid phone number is required' });
    }
    if (!postcode || !postcode.match(/^[A-Z]{1,2}[0-9][A-Z0-9]?\s?[0-9][A-Z]{2}$/i)) {
      errors.push({ field: 'postcode', message: 'Valid UK postcode is required' });
    }
    if (!service) {
      errors.push({ field: 'service', message: 'Please select a service' });
    }
    if (!consent) {
      errors.push({ field: 'consent', message: 'Consent is required to submit this form' });
    }

    if (errors.length > 0) {
      return new Response(JSON.stringify({
        success: false,
        errors,
        message: 'Please correct the highlighted fields.'
      }), {
        status: 400,
        headers: { 'Content-Type': 'application/json', ...corsHeaders }
      });
    }

    // Generate unique enquiry ID
    const timestamp = Date.now().toString(36).toUpperCase();
    const random = Math.random().toString(36).substring(2, 6).toUpperCase();
    const enquiryId = `CGM-${timestamp}-${random}`;

    // Postcode area validation (check if in coverage area)
    const postcodeArea = postcode.match(/^[A-Z]{1,2}[0-9]/)?.[0] || '';
    const coveredAreas = ['OX', 'HP', 'SL', 'RG', 'MK', 'LU'];
    const isCovered = coveredAreas.some(area => postcodeArea.startsWith(area));

    // Lead score calculation
    const annotatedPhotoCount = photos.filter(p => p.kind === 'annotated').length;
    const regularPhotoCount = photos.filter(p => p.kind === 'upload').length;
    let leadScore = 0;
    if (isCovered) leadScore += 30;
    if (phone) leadScore += 20;
    if (email) leadScore += 10;
    if (service && service !== 'Other') leadScore += 15;
    if (when === 'ASAP') leadScore += 15;
    if (regularPhotoCount > 0) leadScore += 10;
    if (annotatedPhotoCount > 0) leadScore += 15; // Annotated photos are higher quality leads

    // Build lead object
    const lead = {
      enquiryId,
      submittedAt: new Date().toISOString(),
      name,
      phone,
      email: email || null,
      postcode,
      postcodeArea,
      isCovered,
      service,
      timescale: when,
      details,
      preferredContact,
      photos: photos.map(p => ({ name: p.name, size: p.size, type: p.type, kind: p.kind })),
      photoCount: photos.length,
      annotatedPhotoCount,
      regularPhotoCount,
      sourcePage: sourcePage || '/booking/',
      calculatorData: calculatorData || null,
      consent: true,
      consentAt: new Date().toISOString(),
      leadScore,
      leadGrade: leadScore >= 70 ? 'A' : leadScore >= 50 ? 'B' : leadScore >= 30 ? 'C' : 'D',
      status: 'new'
    };

    // Store lead (in production: save to D1 database or send to CRM webhook)
    leadStore.set(enquiryId, lead);

    // Send confirmation email via Resend (if API key configured)
    let emailSent = false;
    if (env.RESEND_API_KEY) {
      try {
        const emailResponse = await fetch('https://api.resend.com/emails', {
          method: 'POST',
          headers: {
            'Authorization': `Bearer ${env.RESEND_API_KEY}`,
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({
            from: env.CGM_EMAIL_FROM || 'noreply@chilterngardenmaintenance.com',
            to: env.CGM_EMAIL_TO || 'hello@chilterngardenmaintenance.com',
            subject: `New enquiry ${enquiryId} - ${name} (${lead.leadGrade}-grade lead)`,
            html: `
              <h2>New garden enquiry: ${enquiryId}</h2>
              <table style="border-collapse:collapse;width:100%;">
                <tr><td style="padding:8px;border:1px solid #ddd;font-weight:bold;">Name</td><td style="padding:8px;border:1px solid #ddd;">${name}</td></tr>
                <tr><td style="padding:8px;border:1px solid #ddd;font-weight:bold;">Phone</td><td style="padding:8px;border:1px solid #ddd;">${phone}</td></tr>
                <tr><td style="padding:8px;border:1px solid #ddd;font-weight:bold;">Email</td><td style="padding:8px;border:1px solid #ddd;">${email || 'Not provided'}</td></tr>
                <tr><td style="padding:8px;border:1px solid #ddd;font-weight:bold;">Postcode</td><td style="padding:8px;border:1px solid #ddd;">${postcode} ${isCovered ? '✅ Covered' : '⚠️ Check coverage'}</td></tr>
                <tr><td style="padding:8px;border:1px solid #ddd;font-weight:bold;">Service</td><td style="padding:8px;border:1px solid #ddd;">${service}</td></tr>
                <tr><td style="padding:8px;border:1px solid #ddd;font-weight:bold;">Timescale</td><td style="padding:8px;border:1px solid #ddd;">${when || 'Not specified'}</td></tr>
                <tr><td style="padding:8px;border:1px solid #ddd;font-weight:bold;">Preferred contact</td><td style="padding:8px;border:1px solid #ddd;">${preferredContact}</td></tr>
                <tr><td style="padding:8px;border:1px solid #ddd;font-weight:bold;">Photos</td><td style="padding:8px;border:1px solid #ddd;">${photos.length} photo(s) attached${annotatedPhotoCount > 0 ? ` (${annotatedPhotoCount} annotated with labels)` : ''}</td></tr>
                <tr><td style="padding:8px;border:1px solid #ddd;font-weight:bold;">Lead grade</td><td style="padding:8px;border:1px solid #ddd;">${lead.leadGrade} (score: ${leadScore}/100)</td></tr>
                <tr><td style="padding:8px;border:1px solid #ddd;font-weight:bold;">Source</td><td style="padding:8px;border:1px solid #ddd;">${sourcePage || '/booking/'}</td></tr>
              </table>
              <h3>Details</h3>
              <p>${details || 'No additional details provided'}</p>
              ${calculatorData ? `<h3>Calculator data</h3><pre>${calculatorData}</pre>` : ''}
              <hr>
              <p style="font-size:12px;color:#999;">Enquiry ID: ${enquiryId}<br>Submitted: ${lead.submittedAt}<br>Consent: Given at ${lead.consentAt}</p>
            `,
          }),
        });

        if (emailResponse.ok) {
          emailSent = true;
        }
      } catch (emailError) {
        console.error('Email send failed:', emailError);
      }
    }

    // Send WhatsApp notification via WhatsApp Business API (if configured)
    // This would use the WhatsApp Business Cloud API
    // For now, we store the lead and the CGM team can follow up manually

    // Return success response
    return new Response(JSON.stringify({
      success: true,
      enquiryId,
      message: `Thank you, ${name}. Your enquiry has been received. Your reference is ${enquiryId}.`,
      leadGrade: lead.leadGrade,
      isCovered,
      emailSent,
      nextSteps: isCovered
        ? 'We will contact you within one working day to arrange your free site visit.'
        : 'We will check your postcode and get back to you to confirm whether we can help.'
    }), {
      status: 200,
      headers: { 'Content-Type': 'application/json', ...corsHeaders }
    });

  } catch (error) {
    console.error('Quote submission error:', error);
    return new Response(JSON.stringify({
      success: false,
      message: 'An error occurred while submitting your enquiry. Please try again or call us directly.',
      error: error.message
    }), {
      status: 500,
      headers: { 'Content-Type': 'application/json', ...corsHeaders }
    });
  }
}

// GET endpoint to check enquiry status (for future CRM integration)
export async function onRequestGet({ request, env }) {
  const url = new URL(request.url);
  const enquiryId = url.searchParams.get('id');

  if (!enquiryId) {
    return new Response(JSON.stringify({
      success: false,
      message: 'Enquiry ID is required'
    }), {
      status: 400,
      headers: { 'Content-Type': 'application/json' }
    });
  }

  const lead = leadStore.get(enquiryId);
  if (!lead) {
    return new Response(JSON.stringify({
      success: false,
      message: 'Enquiry not found'
    }), {
      status: 404,
      headers: { 'Content-Type': 'application/json' }
    });
  }

  return new Response(JSON.stringify({
    success: true,
    enquiry: {
      enquiryId: lead.enquiryId,
      status: lead.status,
      submittedAt: lead.submittedAt,
      leadGrade: lead.leadGrade,
      isCovered: lead.isCovered
    }
  }), {
    status: 200,
    headers: { 'Content-Type': 'application/json' }
  });
}
