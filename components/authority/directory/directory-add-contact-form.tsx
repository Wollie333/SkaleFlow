'use client';

import { useState, useRef } from 'react';
import { PhotoIcon } from '@heroicons/react/24/outline';
import { PR_DIRECTORY_CATEGORIES, PR_DIRECTORY_INDUSTRIES } from '@/lib/authority/directory-constants';
import type { PRDirectoryCategory } from '@/types/database';

interface DirectoryAddContactFormProps {
  onSubmit: (data: Record<string, unknown>) => Promise<void>;
  loading: boolean;
}

export function DirectoryAddContactForm({ onSubmit, loading }: DirectoryAddContactFormProps) {
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [photoPreview, setPhotoPreview] = useState<string | null>(null);
  const [photoFile, setPhotoFile] = useState<File | null>(null);
  const [uploadingPhoto, setUploadingPhoto] = useState(false);

  const [fullName, setFullName] = useState('');
  const [company, setCompany] = useState('');
  const [jobTitle, setJobTitle] = useState('');
  const [email, setEmail] = useState('');
  const [phone, setPhone] = useState('');
  const [description, setDescription] = useState('');
  const [websiteUrl, setWebsiteUrl] = useState('');
  const [category, setCategory] = useState<PRDirectoryCategory | ''>('');
  const [selectedIndustries, setSelectedIndustries] = useState<string[]>([]);
  const [country, setCountry] = useState('');
  const [city, setCity] = useState('');
  const [provinceState, setProvinceState] = useState('');
  const [linkedin, setLinkedin] = useState('');
  const [twitter, setTwitter] = useState('');
  const [instagram, setInstagram] = useState('');
  const [facebook, setFacebook] = useState('');

  const handlePhotoChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    if (file.size > 2 * 1024 * 1024) {
      alert('Photo must be under 2MB');
      return;
    }
    setPhotoFile(file);
    setPhotoPreview(URL.createObjectURL(file));
  };

  const uploadPhoto = async (): Promise<string | null> => {
    if (!photoFile) return null;
    setUploadingPhoto(true);
    try {
      const formData = new FormData();
      formData.append('file', photoFile);
      const res = await fetch('/api/authority/directory/photo', { method: 'POST', body: formData });
      if (!res.ok) return null;
      const data = await res.json();
      return data.photoUrl;
    } finally {
      setUploadingPhoto(false);
    }
  };

  const toggleIndustry = (industry: string) => {
    setSelectedIndustries((prev) =>
      prev.includes(industry) ? prev.filter((i) => i !== industry) : [...prev, industry]
    );
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!fullName || !category) return;

    let photoUrl: string | null = null;
    if (photoFile) {
      photoUrl = await uploadPhoto();
    }

    const socialLinks: Record<string, string> = {};
    if (linkedin) socialLinks.linkedin = linkedin;
    if (twitter) socialLinks.twitter = twitter;
    if (instagram) socialLinks.instagram = instagram;
    if (facebook) socialLinks.facebook = facebook;

    await onSubmit({
      full_name: fullName,
      company: company || null,
      job_title: jobTitle || null,
      email: email || null,
      phone: phone || null,
      description: description || null,
      website_url: websiteUrl || null,
      photo_url: photoUrl,
      social_links: Object.keys(socialLinks).length > 0 ? socialLinks : null,
      category,
      industry_types: selectedIndustries.length > 0 ? selectedIndustries : [],
      country: country || null,
      city: city || null,
      province_state: provinceState || null,
    });
  };

  const inputClass = 'w-full px-3 py-2 rounded-lg border border-gray-200 bg-white text-sm focus:outline-none focus:ring-2 focus:ring-teal-500 focus:border-transparent';
  const labelClass = 'block text-sm font-medium text-gray-700 mb-1';

  return (
    <form onSubmit={handleSubmit} className="space-y-6">
      {/* Photo upload */}
      <div>
        <label className={labelClass}>Photo</label>
        <div
          onClick={() => fileInputRef.current?.click()}
          className="flex items-center gap-4 p-4 border-2 border-dashed border-gray-200 rounded-lg cursor-pointer hover:border-teal-300 transition-colors"
        >
          {photoPreview ? (
            <img src={photoPreview} alt="Preview" className="h-16 w-16 rounded-full object-cover" />
          ) : (
            <div className="h-16 w-16 rounded-full bg-gray-100 flex items-center justify-center">
              <PhotoIcon className="h-8 w-8 text-gray-400" />
            </div>
          )}
          <div>
            <p className="text-sm font-medium text-gray-700">
              {photoPreview ? 'Change photo' : 'Upload a photo'}
            </p>
            <p className="text-xs text-gray-500">JPEG, PNG or WebP. Max 2MB.</p>
          </div>
          <input
            ref={fileInputRef}
            type="file"
            accept="image/jpeg,image/png,image/webp"
            onChange={handlePhotoChange}
            className="hidden"
          />
        </div>
      </div>

      {/* Name + Company */}
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
        <div>
          <label className={labelClass}>
            Full Name <span className="text-red-500">*</span>
          </label>
          <input
            type="text"
            required
            value={fullName}
            onChange={(e) => setFullName(e.target.value)}
            placeholder="e.g. Jane Smith"
            className={inputClass}
          />
        </div>
        <div>
          <label className={labelClass}>Company / Outlet</label>
          <input
            type="text"
            value={company}
            onChange={(e) => setCompany(e.target.value)}
            placeholder="e.g. The Daily News"
            className={inputClass}
          />
        </div>
      </div>

      {/* Job Title + Email */}
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
        <div>
          <label className={labelClass}>Job Title</label>
          <input
            type="text"
            value={jobTitle}
            onChange={(e) => setJobTitle(e.target.value)}
            placeholder="e.g. Senior Editor"
            className={inputClass}
          />
        </div>
        <div>
          <label className={labelClass}>Email</label>
          <input
            type="email"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            placeholder="jane@example.com"
            className={inputClass}
          />
        </div>
      </div>

      {/* Phone + Website */}
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
        <div>
          <label className={labelClass}>Phone</label>
          <input
            type="tel"
            value={phone}
            onChange={(e) => setPhone(e.target.value)}
            placeholder="+27 82 123 4567"
            className={inputClass}
          />
        </div>
        <div>
          <label className={labelClass}>Website</label>
          <input
            type="url"
            value={websiteUrl}
            onChange={(e) => setWebsiteUrl(e.target.value)}
            placeholder="https://..."
            className={inputClass}
          />
        </div>
      </div>

      {/* Description */}
      <div>
        <label className={labelClass}>Description</label>
        <textarea
          value={description}
          onChange={(e) => setDescription(e.target.value.slice(0, 500))}
          placeholder="Brief bio or what they cover..."
          rows={3}
          className={inputClass}
        />
        <p className="text-xs text-gray-400 mt-1">{description.length}/500</p>
      </div>

      {/* Category */}
      <div>
        <label className={labelClass}>
          Category <span className="text-red-500">*</span>
        </label>
        <select
          required
          value={category}
          onChange={(e) => setCategory(e.target.value as PRDirectoryCategory)}
          className={inputClass}
        >
          <option value="">Select a category</option>
          {(Object.entries(PR_DIRECTORY_CATEGORIES) as [PRDirectoryCategory, { label: string }][]).map(
            ([key, { label }]) => (
              <option key={key} value={key}>
                {label}
              </option>
            )
          )}
        </select>
      </div>

      {/* Industries */}
      <div>
        <label className={labelClass}>Industries</label>
        <div className="flex flex-wrap gap-2">
          {PR_DIRECTORY_INDUSTRIES.map((industry) => (
            <label
              key={industry}
              className={`inline-flex items-center px-3 py-1.5 rounded-full text-xs font-medium cursor-pointer transition-colors ${
                selectedIndustries.includes(industry)
                  ? 'bg-teal-100 text-teal-800 border border-teal-200'
                  : 'bg-white border border-gray-200 text-gray-600 hover:bg-gray-100'
              }`}
            >
              <input
                type="checkbox"
                checked={selectedIndustries.includes(industry)}
                onChange={() => toggleIndustry(industry)}
                className="sr-only"
              />
              {industry}
            </label>
          ))}
        </div>
      </div>

      {/* Location */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <div>
          <label className={labelClass}>Country</label>
          <input
            type="text"
            value={country}
            onChange={(e) => setCountry(e.target.value)}
            placeholder="e.g. South Africa"
            className={inputClass}
          />
        </div>
        <div>
          <label className={labelClass}>City</label>
          <input
            type="text"
            value={city}
            onChange={(e) => setCity(e.target.value)}
            placeholder="e.g. Cape Town"
            className={inputClass}
          />
        </div>
        <div>
          <label className={labelClass}>Province / State</label>
          <input
            type="text"
            value={provinceState}
            onChange={(e) => setProvinceState(e.target.value)}
            placeholder="e.g. Western Cape"
            className={inputClass}
          />
        </div>
      </div>

      {/* Social links */}
      <div>
        <label className={labelClass}>Social Links</label>
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
          <input
            type="url"
            value={linkedin}
            onChange={(e) => setLinkedin(e.target.value)}
            placeholder="LinkedIn URL"
            className={inputClass}
          />
          <input
            type="url"
            value={twitter}
            onChange={(e) => setTwitter(e.target.value)}
            placeholder="Twitter/X URL"
            className={inputClass}
          />
          <input
            type="url"
            value={instagram}
            onChange={(e) => setInstagram(e.target.value)}
            placeholder="Instagram URL"
            className={inputClass}
          />
          <input
            type="url"
            value={facebook}
            onChange={(e) => setFacebook(e.target.value)}
            placeholder="Facebook URL"
            className={inputClass}
          />
        </div>
      </div>

      {/* Submit */}
      <div className="flex justify-end">
        <button
          type="submit"
          disabled={loading || uploadingPhoto || !fullName || !category}
          className="px-6 py-2.5 rounded-lg bg-teal-600 text-white font-medium hover:bg-teal-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed text-sm"
        >
          {loading || uploadingPhoto ? 'Adding...' : 'Add to Directory'}
        </button>
      </div>
    </form>
  );
}
