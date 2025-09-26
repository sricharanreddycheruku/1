import React, { useState, useRef } from 'react';
import { Camera, MapPin, Save, AlertCircle, CheckCircle } from 'lucide-react';
import { ChildRecord } from '../types';
import { generateHealthId, calculateBMI, getMalnutritionStatus } from '../utils/healthId';
import { db } from '../services/database';
import { AuthService } from '../services/auth';
import { useTranslation } from 'react-i18next';

interface ChildRecordFormProps {
  onSaved: () => void;
}

export function ChildRecordForm({ onSaved }: ChildRecordFormProps) {
  const { t, i18n } = useTranslation();

  const [formData, setFormData] = useState({
    childName: '',
    age: '',
    childWeight: '',
    childHeight: '',
    parentGuardianName: '',
    visibleSignsMalnutrition: '',
    recentIllnesses: '',
    parentalConsent: false,
    language: (localStorage.getItem('appLanguage') || 'en') as 'en' | 'hi' | 'te' | 'kn',
  });
  const [facePhoto, setFacePhoto] = useState<string>('');
  const [location, setLocation] = useState<GeolocationCoordinates | null>(null);
  const [loading, setLoading] = useState(false);
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [saved, setSaved] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const getCurrentLocation = () => {
    if (!navigator.geolocation) {
      alert(t('alerts.geolocationNotSupported'));
      return;
    }
    navigator.geolocation.getCurrentPosition(
      (position) => {
        setLocation(position.coords);
      },
      (error) => {
        console.error('Error getting location:', error);
        alert(t('alerts.unableToGetLocation'));
      }
    );
  };

  const handlePhotoCapture = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (file) {
      const reader = new FileReader();
      reader.onload = (e) => {
        setFacePhoto(e.target?.result as string);
      };
      reader.readAsDataURL(file);
    }
  };

  const validateForm = () => {
    const newErrors: Record<string, string> = {};
    if (!formData.childName.trim()) newErrors.childName = t('validation.childNameRequired');
    if (!formData.age || Number(formData.age) <= 0) newErrors.age = t('validation.ageRequired');
    if (!formData.childWeight || Number(formData.childWeight) <= 0) newErrors.childWeight = t('validation.weightRequired');
    if (!formData.childHeight || Number(formData.childHeight) <= 0) newErrors.childHeight = t('validation.heightRequired');
    if (!formData.parentGuardianName.trim()) newErrors.parentGuardianName = t('validation.parentNameRequired');
    if (!formData.parentalConsent) newErrors.parentalConsent = t('validation.consentRequired');
    if (!facePhoto) newErrors.facePhoto = t('validation.photoRequired');
    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!validateForm()) return;
    setLoading(true);
    try {
      const currentUser = AuthService.getCurrentUser();
      if (!currentUser) throw new Error(t('alerts.noAuthUser'));

      const bmi = calculateBMI(Number(formData.childWeight), Number(formData.childHeight));
      const malnutritionStatus = getMalnutritionStatus(bmi, Number(formData.age));

      const record: ChildRecord = {
        id: `child_${Date.now()}`,
        healthId: generateHealthId(),
        childName: formData.childName,
        facePhoto,
        age: Number(formData.age),
        childWeight: Number(formData.childWeight),
        childHeight: Number(formData.childHeight),
        parentGuardianName: formData.parentGuardianName,
        visibleSignsMalnutrition: formData.visibleSignsMalnutrition || 'None reported',
        recentIllnesses: formData.recentIllnesses || 'None reported',
        parentalConsent: formData.parentalConsent,
        location: location
          ? {
              latitude: location.latitude,
              longitude: location.longitude
            }
          : undefined,
        createdAt: new Date(),
        updatedAt: new Date(),
        isUploaded: false,
        representativeId: currentUser.id,
        language: formData.language
      };

      await db.saveChildRecord(record);
      setSaved(true);

      alert(
        t('alerts.savedMessage', {
          healthId: record.healthId,
          bmi: bmi.toFixed(1),
          status: malnutritionStatus
        })
      );

      // Reset form
      setFormData({
        childName: '',
        age: '',
        childWeight: '',
        childHeight: '',
        parentGuardianName: '',
        visibleSignsMalnutrition: '',
        recentIllnesses: '',
        parentalConsent: false,
        language: 'en'
      });
      setFacePhoto('');
      setLocation(null);

      setTimeout(() => {
        setSaved(false);
        onSaved();
      }, 1200);
    } catch (error) {
      console.error('Error saving record:', error);
      alert(t('alerts.saveFailed'));
    } finally {
      setLoading(false);
    }
  };

  if (saved) {
    return (
      <div className="flex items-center justify-center py-16">
        <div className="text-center">
          <CheckCircle className="w-16 h-16 text-green-500 mx-auto mb-4" />
          <h3 className="text-2xl font-semibold text-gray-900 mb-2">{t('recordSavedTitle')}</h3>
          <p className="text-gray-600">{t('recordSavedRedirect')}</p>
        </div>
      </div>
    );
  }

  return (
    <div className="bg-white rounded-xl shadow-lg p-6">
      <div className="mb-6">
        <h2 className="text-2xl font-bold text-gray-900 mb-2">{t('newChildHealthRecord')}</h2>
        <p className="text-gray-600">{t('fillInDetails')}</p>
      </div>

      <form onSubmit={handleSubmit} className="space-y-6">
        {/* Child Photo */}
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">
            {t('childPhoto')} <span className="text-red-500">*</span>
          </label>

          <div className="flex items-center space-x-4">
            {facePhoto ? (
              <div className="relative">
                <img src={facePhoto} alt="Child" className="w-24 h-24 object-cover rounded-lg border-2 border-gray-300" />
                <button type="button" onClick={() => setFacePhoto('')} className="absolute -top-2 -right-2 w-6 h-6 bg-red-500 text-white rounded-full text-xs hover:bg-red-600">
                  ×
                </button>
              </div>
            ) : (
              <div className="w-24 h-24 border-2 border-dashed border-gray-300 rounded-lg flex items-center justify-center">
                <Camera className="w-8 h-8 text-gray-400" />
              </div>
            )}

            <button type="button" onClick={() => fileInputRef.current?.click()} className="px-4 py-2 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700 flex items-center space-x-2">
              <Camera className="w-4 h-4" />
              <span>{t('captureUploadPhoto')}</span>
            </button>

            <input ref={fileInputRef} type="file" accept="image/*" capture="environment" onChange={handlePhotoCapture} className="hidden" />
          </div>

          {errors.facePhoto && (
            <p className="mt-1 text-sm text-red-600 flex items-center">
              <AlertCircle className="w-4 h-4 mr-1" />
              {errors.facePhoto}
            </p>
          )}
        </div>

        {/* Basic Information */}
        <div className="grid md:grid-cols-2 gap-6">
          <div>
            <label htmlFor="childName" className="block text-sm font-medium text-gray-700 mb-1">
              {t('childName')} <span className="text-red-500">*</span>
            </label>
            <input
              type="text"
              id="childName"
              value={formData.childName}
              onChange={(e) => setFormData({ ...formData, childName: e.target.value })}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-transparent"
              placeholder={t('placeholders.childName')}
            />
            {errors.childName && (
              <p className="mt-1 text-sm text-red-600 flex items-center">
                <AlertCircle className="w-4 h-4 mr-1" />
                {errors.childName}
              </p>
            )}
          </div>

          <div>
            <label htmlFor="age" className="block text-sm font-medium text-gray-700 mb-1">
              {t('age')} <span className="text-red-500">*</span>
            </label>
            <input
              type="number"
              id="age"
              min="0"
              max="18"
              step="0.1"
              value={formData.age}
              onChange={(e) => setFormData({ ...formData, age: e.target.value })}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-transparent"
              placeholder={t('placeholders.age')}
            />
            {errors.age && (
              <p className="mt-1 text-sm text-red-600 flex items-center">
                <AlertCircle className="w-4 h-4 mr-1" />
                {errors.age}
              </p>
            )}
          </div>
        </div>

        {/* Physical Measurements */}
        <div className="grid md:grid-cols-2 gap-6">
          <div>
            <label htmlFor="childWeight" className="block text-sm font-medium text-gray-700 mb-1">
              {t('weight')} <span className="text-red-500">*</span>
            </label>
            <input
              type="number"
              id="childWeight"
              min="0"
              step="0.1"
              value={formData.childWeight}
              onChange={(e) => setFormData({ ...formData, childWeight: e.target.value })}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-transparent"
              placeholder={t('placeholders.measurePlaceholder')}
            />
            {errors.childWeight && (
              <p className="mt-1 text-sm text-red-600 flex items-center">
                <AlertCircle className="w-4 h-4 mr-1" />
                {errors.childWeight}
              </p>
            )}
          </div>

          <div>
            <label htmlFor="childHeight" className="block text-sm font-medium text-gray-700 mb-1">
              {t('height')} <span className="text-red-500">*</span>
            </label>
            <input
              type="number"
              id="childHeight"
              min="0"
              step="0.1"
              value={formData.childHeight}
              onChange={(e) => setFormData({ ...formData, childHeight: e.target.value })}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-transparent"
              placeholder={t('placeholders.measurePlaceholder')}
            />
            {errors.childHeight && (
              <p className="mt-1 text-sm text-red-600 flex items-center">
                <AlertCircle className="w-4 h-4 mr-1" />
                {errors.childHeight}
              </p>
            )}
          </div>
        </div>

        {/* Parent/Guardian Information */}
        <div>
          <label htmlFor="parentGuardianName" className="block text-sm font-medium text-gray-700 mb-1">
            {t('parentGuardianName')} <span className="text-red-500">*</span>
          </label>
          <input
            type="text"
            id="parentGuardianName"
            value={formData.parentGuardianName}
            onChange={(e) => setFormData({ ...formData, parentGuardianName: e.target.value })}
            className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-transparent"
            placeholder={t('placeholders.parentName')}
          />
          {errors.parentGuardianName && (
            <p className="mt-1 text-sm text-red-600 flex items-center">
              <AlertCircle className="w-4 h-4 mr-1" />
              {errors.parentGuardianName}
            </p>
          )}
        </div>

        {/* Health Information */}
        <div className="grid md:grid-cols-2 gap-6">
          <div>
            <label htmlFor="visibleSignsMalnutrition" className="block text-sm font-medium text-gray-700 mb-1">
              {t('visibleSignsMalnutrition')}
            </label>
            <textarea
              id="visibleSignsMalnutrition"
              rows={3}
              value={formData.visibleSignsMalnutrition}
              onChange={(e) => setFormData({ ...formData, visibleSignsMalnutrition: e.target.value })}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-transparent"
              placeholder={t('placeholders.visibleSignsPlaceholder')}
            />
          </div>

          <div>
            <label htmlFor="recentIllnesses" className="block text-sm font-medium text-gray-700 mb-1">
              {t('recentIllnesses')}
            </label>
            <textarea
              id="recentIllnesses"
              rows={3}
              value={formData.recentIllnesses}
              onChange={(e) => setFormData({ ...formData, recentIllnesses: e.target.value })}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-transparent"
              placeholder={t('placeholders.recentIllnessesPlaceholder')}
            />
          </div>
        </div>



        {/* Location */}
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">{t('getLocation')}</label>
          <div className="flex items-center space-x-4">
            {location ? (
              <div className="flex-1 p-3 bg-green-50 border border-green-200 rounded-lg">
                <p className="text-sm text-green-800">📍 {t('locationCaptured', { lat: location.latitude.toFixed(6), lng: location.longitude.toFixed(6) })}</p>
              </div>
            ) : (
              <div className="flex-1 p-3 bg-gray-50 border border-gray-200 rounded-lg">
                <p className="text-sm text-gray-600">{t('noLocationCaptured')}</p>
              </div>
            )}

            <button type="button" onClick={getCurrentLocation} className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 flex items-center space-x-2">
              <MapPin className="w-4 h-4" />
              <span>{t('getLocation')}</span>
            </button>
          </div>
        </div>

        {/* Parental Consent */}
        <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-4">
          <div className="flex items-start space-x-3">
            <input
              type="checkbox"
              id="parentalConsent"
              checked={formData.parentalConsent}
              onChange={(e) => setFormData({ ...formData, parentalConsent: e.target.checked })}
              className="mt-1 w-5 h-5 text-indigo-600 border-gray-300 rounded focus:ring-indigo-500"
            />
            <div>
              <label htmlFor="parentalConsent" className="block text-sm font-medium text-gray-900">
                {t('parentalConsent')} <span className="text-red-500">*</span>
              </label>
              <p className="text-sm text-gray-600 mt-1">{t('parentalConsentText')}</p>
            </div>
          </div>

          {errors.parentalConsent && (
            <p className="mt-2 text-sm text-red-600 flex items-center">
              <AlertCircle className="w-4 h-4 mr-1" />
              {errors.parentalConsent}
            </p>
          )}
        </div>

        {/* Submit Button */}
        <div className="flex justify-end space-x-4 pt-6">
          <button type="submit" disabled={loading} className="px-8 py-3 bg-gradient-to-r from-green-500 to-green-600 text-white font-medium rounded-lg hover:from-green-600 hover:to-green-700 focus:ring-2 focus:ring-green-500 focus:ring-offset-2 transition-all duration-200 disabled:opacity-50 disabled:cursor-not-allowed flex items-center space-x-2">
            {loading ? (
              <div className="w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin" />
            ) : (
              <>
                <Save className="w-5 h-5" />
                <span>{t('saveRecord')}</span>
              </>
            )}
          </button>
        </div>
      </form>
    </div>
  );
}
