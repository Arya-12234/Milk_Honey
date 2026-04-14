import React, { useState } from 'react';
import { mlAPI } from '../../services/api';
import './EnquiryPage.css';

const CROP_OPTIONS = [
  { value: 'orchards', label: 'Orchards' },
  { value: 'outdoor_vegetables', label: 'Outdoor Vegetables' },
  { value: 'greenhouse', label: 'Greenhouse' },
  { value: 'field_crop', label: 'Field Crop' },
];

const IRRIGATION_OPTIONS = [
  { value: 'few_times_year', label: 'Yes, a few times a year' },
  { value: 'several_times_year', label: 'Yes, several times a year' },
  { value: 'plan_to_build', label: 'No, but plan to build an irrigation system in the future' },
  { value: 'no_irrigation', label: "No, I don't need/want irrigation to grow" },
];

const INITIAL = {
  email: '', name: '', address: '', phone: '',
  crop_type: '', varieties: '', irrigation: '',
  land_hectares: '', message: '',
};

export default function EnquiryPage() {
  const [form, setForm] = useState(INITIAL);
  const [errors, setErrors] = useState({});
  const [loading, setLoading] = useState(false);
  const [submitted, setSubmitted] = useState(false);

  const set = (k, v) => {
    setForm(f => ({ ...f, [k]: v }));
    if (errors[k]) setErrors(e => ({ ...e, [k]: '' }));
  };

  const validate = () => {
    const e = {};
    if (!form.email) e.email = 'Email is required';
    else if (!/\S+@\S+\.\S+/.test(form.email)) e.email = 'Enter a valid email';
    if (!form.name) e.name = 'Name is required';
    if (!form.varieties) e.varieties = 'Please specify what you grow';
    return e;
  };

  const handleSubmit = async (ev) => {
    ev.preventDefault();
    const errs = validate();
    if (Object.keys(errs).length) { setErrors(errs); return; }
    setLoading(true);
    try {
      await mlAPI.submitEnquiry(form);
      setSubmitted(true);
    } catch (err) {
      setErrors({ submit: 'Failed to send. Please try again.' });
    } finally {
      setLoading(false);
    }
  };

  if (submitted) {
    return (
      <div className="enquiry-page">
        <div className="enquiry-hero">
          <div className="container enquiry-hero-inner">
            <h1>M &amp; H Enquiry</h1>
          </div>
        </div>
        <div className="container">
          <div className="enquiry-success card">
            <span>🌿</span>
            <h2>Thank you, {form.name}!</h2>
            <p>We've received your enquiry and will be in touch with a tailored plan for your farm.</p>
            <button className="btn btn-gold" onClick={() => { setForm(INITIAL); setSubmitted(false); }}>
              Submit Another Enquiry
            </button>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="enquiry-page">
      <div className="enquiry-hero">
        <div className="container enquiry-hero-inner">
          <h1>M &amp; H Enquiry</h1>
          <p>Fill out this form and we will compile an offer for you on the best that meets your expectations.</p>
          <span className="required-note">* Mandatory fields</span>
        </div>
      </div>

      <div className="container">
        <form className="enquiry-form card" onSubmit={handleSubmit} noValidate>
          <div className="field">
            <label>E-mail Address *</label>
            <input type="email" value={form.email} onChange={e => set('email', e.target.value)}
              placeholder="E-mail Address *" className={errors.email ? 'error' : ''} />
            {errors.email && <span className="field-hint error">⚠ {errors.email}</span>}
          </div>

          <div className="field">
            <label>Name</label>
            <input type="text" value={form.name} onChange={e => set('name', e.target.value)}
              placeholder="Name" className={errors.name ? 'error' : ''} />
            {errors.name && <span className="field-hint error">⚠ {errors.name}</span>}
          </div>

          <div className="field">
            <label>Address</label>
            <input type="text" value={form.address} onChange={e => set('address', e.target.value)}
              placeholder="Address" />
          </div>

          <div className="field">
            <label>Phone Number</label>
            <input type="tel" value={form.phone} onChange={e => set('phone', e.target.value)}
              placeholder="+254 700 000 000" />
          </div>

          <fieldset className="enquiry-fieldset">
            <legend>What kind of crops do you grow?</legend>
            {CROP_OPTIONS.map(opt => (
              <label key={opt.value} className="radio-label">
                <input type="radio" name="crop_type" value={opt.value}
                  checked={form.crop_type === opt.value}
                  onChange={() => set('crop_type', opt.value)} />
                {opt.label}
              </label>
            ))}
          </fieldset>

          <div className="field">
            <label>What varieties do you grow? *</label>
            <input type="text" value={form.varieties} onChange={e => set('varieties', e.target.value)}
              placeholder="e.g. Roma tomatoes, cherry tomatoes" className={errors.varieties ? 'error' : ''} />
            {errors.varieties && <span className="field-hint error">⚠ {errors.varieties}</span>}
          </div>

          <fieldset className="enquiry-fieldset">
            <legend>Do you irrigate your production area?</legend>
            {IRRIGATION_OPTIONS.map(opt => (
              <label key={opt.value} className="radio-label">
                <input type="radio" name="irrigation" value={opt.value}
                  checked={form.irrigation === opt.value}
                  onChange={() => set('irrigation', opt.value)} />
                {opt.label}
              </label>
            ))}
          </fieldset>

          <div className="field">
            <label>How much land do you currently farm (hectares) *</label>
            <input type="text" value={form.land_hectares} onChange={e => set('land_hectares', e.target.value)}
              placeholder="e.g. 2.5" />
          </div>

          <div className="field">
            <label>Message / Questions</label>
            <textarea rows={4} value={form.message} onChange={e => set('message', e.target.value)}
              placeholder="Any additional information or questions..." />
          </div>

          <div className="enquiry-disclaimer">
            <strong>MILK &amp; HONEY</strong>
            <p>
              Information about filling this form — By submitting the data, the person agrees that their
              data will be entered into our database and they will be contacted with offers related to M&amp;H
              products. You can request to delete from our database by emailing{' '}
              <a href="mailto:sales@mh.com">sales@mh.com</a> with the subject "Subscribe".
            </p>
          </div>

          {errors.submit && <p className="field-hint error">{errors.submit}</p>}

          <button type="submit" className="btn btn-gold" disabled={loading}>
            {loading ? <><span className="spinner" /> Sending…</> : 'Submit'}
          </button>
        </form>
      </div>
    </div>
  );
}
