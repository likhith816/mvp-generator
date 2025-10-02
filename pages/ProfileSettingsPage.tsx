import React, { useState, useRef, useEffect } from 'react';
import { useAuth } from '../contexts/AuthContext';
import type { SubscriptionPlan, User } from '../types';
import Alert from '../components/common/Alert';
import Modal from '../components/common/Modal';

type Message = {
    type: 'success' | 'error';
    text: string;
};

const PLAN_DETAILS: Record<"PRO" | "ENTERPRISE", { price: number; limit: number | string; description: string; benefits: string }> = {
    PRO: {
        price: 500,
        limit: 40,
        description: "Ideal for power users and small projects.",
        benefits: "Get a 40 generation limit and priority support."
    },
    ENTERPRISE: {
        price: 5000,
        limit: 'Unlimited',
        description: "For businesses and large-scale applications.",
        benefits: "Get unlimited generations, team features, and dedicated support."
    }
};

const ProfileSettingsPage: React.FC = () => {
  const { user, updateUser, updateSubscription, changePassword } = useAuth();
  const [name, setName] = useState(user?.name || '');
  const [email, setEmail] = useState(user?.email || '');
  const [phone, setPhone] = useState(user?.phone || '');
  const [avatarPreview, setAvatarPreview] = useState<string | null>(user?.avatar || null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const [currentPassword, setCurrentPassword] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');

  const [profileMessage, setProfileMessage] = useState<Message | null>(null);
  const [passwordMessage, setPasswordMessage] = useState<Message | null>(null);
  
  // State for subscription modal
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [selectedPlan, setSelectedPlan] = useState<SubscriptionPlan | null>(null);


  useEffect(() => {
    if (profileMessage) {
      const timer = setTimeout(() => setProfileMessage(null), 5000);
      return () => clearTimeout(timer);
    }
  }, [profileMessage]);

  useEffect(() => {
    if (passwordMessage) {
      const timer = setTimeout(() => setPasswordMessage(null), 5000);
      return () => clearTimeout(timer);
    }
  }, [passwordMessage]);

  if (!user) {
    return <div>Loading...</div>;
  }
  
  const handleAvatarChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      const file = e.target.files[0];
      const reader = new FileReader();
      reader.onloadend = () => {
        setAvatarPreview(reader.result as string);
      };
      reader.readAsDataURL(file);
    }
  };
  
  const handleProfileUpdate = async (e: React.FormEvent) => {
    e.preventDefault();
    setProfileMessage(null);
    
    if (!name.trim() || !email.trim()) {
        setProfileMessage({ type: 'error', text: 'Name and email cannot be empty.' });
        return;
    }

    try {
      const result = await updateUser({ 
        name, 
        email, 
        phone, 
        avatar: avatarPreview || user.avatar 
      });
      
      if (result.success) {
        setProfileMessage({ type: 'success', text: result.message || 'Profile updated successfully!' });
      } else {
        setProfileMessage({ type: 'error', text: result.message || 'Failed to update profile.' });
      }
    } catch (error) {
      setProfileMessage({ type: 'error', text: 'An error occurred while updating profile.' });
    }
  };

  const handlePasswordChange = async (e: React.FormEvent) => {
    e.preventDefault();
    setPasswordMessage(null);
    
    if (!currentPassword || !newPassword) {
      setPasswordMessage({ type: 'error', text: 'Please fill in all password fields.' });
      return;
    }
    
    if (newPassword !== confirmPassword) {
      setPasswordMessage({ type: 'error', text: 'New passwords do not match.' });
      return;
    }

    try {
      // Use the actual changePassword function from AuthContext
      const result = await changePassword(currentPassword, newPassword);
      
      if (result.success) {
        setPasswordMessage({ type: 'success', text: result.message || 'Password changed successfully!' });
        // Clear form fields on success
        setCurrentPassword('');
        setNewPassword('');
        setConfirmPassword('');
      } else {
        setPasswordMessage({ type: 'error', text: result.message || 'Failed to change password.' });
      }
    } catch (error) {
      setPasswordMessage({ type: 'error', text: 'An error occurred while changing the password.' });
    }
  };

  const handleSubscriptionChange = (plan: SubscriptionPlan) => {
    // Prevent downgrading via this UI
    if (user.subscription === 'ENTERPRISE' || (user.subscription === 'PRO' && plan === 'FREE')) {
        alert("Downgrading plans is not supported through this interface. Please contact support.");
        return;
    }
    // Don't open modal for the free plan
    if (plan === 'FREE') return;

    setSelectedPlan(plan);
    setIsModalOpen(true);
  };

  const handleConfirmUpgrade = async () => {
    if (!selectedPlan) return;

    try {
      const result = await updateSubscription(selectedPlan);
      
      if (result.success) {
        setProfileMessage({ type: 'success', text: result.message || `Successfully upgraded to the ${selectedPlan} plan!` });
      } else {
        setProfileMessage({ type: 'error', text: result.message || 'Failed to upgrade subscription.' });
      }
    } catch (error) {
      setProfileMessage({ type: 'error', text: 'An error occurred while upgrading subscription.' });
    }

    setIsModalOpen(false);
    setSelectedPlan(null);
  };
  
  const planOrder = { FREE: 0, PRO: 1, ENTERPRISE: 2 };

  return (
    <div className="max-w-4xl mx-auto space-y-8">
      <h1 className="text-3xl font-bold">Profile Settings</h1>
      {profileMessage && <div className="mb-4"><Alert type={profileMessage.type} title={profileMessage.type === 'success' ? 'Success' : 'Error'} message={profileMessage.text} onClose={() => setProfileMessage(null)} /></div>}

      {/* Profile Information */}
      <div className="bg-surface p-8 rounded-lg shadow">
        <h2 className="text-xl font-semibold mb-6">Personal Information</h2>
        <form onSubmit={handleProfileUpdate} className="space-y-6">
          <div className="flex items-center space-x-6">
            <img className="h-24 w-24 rounded-full object-cover" src={avatarPreview || user.avatar} alt="Current avatar" />
            <div>
              <input 
                type="file" 
                accept="image/*" 
                ref={fileInputRef} 
                onChange={handleAvatarChange} 
                className="hidden"
                aria-label="Upload profile picture"
              />
              <button type="button" onClick={() => fileInputRef.current?.click()} className="px-4 py-2 border border-gray-600 rounded-md text-sm font-medium text-on-surface bg-surface hover:bg-gray-700">
                Change Picture
              </button>
            </div>
          </div>
          <div className="grid md:grid-cols-2 gap-6">
            <div>
              <label htmlFor="name" className="block text-sm font-medium text-on-surface-variant">Full Name</label>
              <input type="text" id="name" value={name} onChange={e => setName(e.target.value)} className="mt-1 block w-full px-3 py-2 border border-gray-600 bg-gray-700 text-on-surface rounded-md shadow-sm focus:outline-none focus:ring-primary focus:border-primary sm:text-sm"/>
            </div>
            <div>
              <label htmlFor="email" className="block text-sm font-medium text-on-surface-variant">Email Address</label>
              <input type="email" id="email" value={email} onChange={e => setEmail(e.target.value)} className="mt-1 block w-full px-3 py-2 border border-gray-600 bg-gray-700 text-on-surface rounded-md shadow-sm focus:outline-none focus:ring-primary focus:border-primary sm:text-sm"/>
            </div>
             <div>
              <label htmlFor="phone" className="block text-sm font-medium text-on-surface-variant">Phone</label>
              <input type="tel" id="phone" value={phone} onChange={e => setPhone(e.target.value)} className="mt-1 block w-full px-3 py-2 border border-gray-600 bg-gray-700 text-on-surface rounded-md shadow-sm focus:outline-none focus:ring-primary focus:border-primary sm:text-sm"/>
            </div>
          </div>
          <div className="text-right">
            <button type="submit" className="inline-flex justify-center py-2 px-4 border border-transparent shadow-sm text-sm font-medium rounded-md text-white bg-primary hover:bg-primary/90">
              Save Changes
            </button>
          </div>
        </form>
      </div>

      {/* Change Password */}
      {user.hasPassword && (
        <div className="bg-surface p-8 rounded-lg shadow">
          <h2 className="text-xl font-semibold mb-6">Change Password</h2>
          <form onSubmit={handlePasswordChange} className="space-y-4">
              {passwordMessage && <Alert type={passwordMessage.type} title={passwordMessage.type === 'success' ? 'Success' : 'Error'} message={passwordMessage.text} onClose={() => setPasswordMessage(null)} />}
              <div>
                <label htmlFor="current-password" className="block text-sm font-medium text-on-surface-variant">Current Password</label>
                <input type="password" id="current-password" value={currentPassword} onChange={e => setCurrentPassword(e.target.value)} required className="mt-1 block w-full px-3 py-2 border border-gray-600 bg-gray-700 text-on-surface rounded-md shadow-sm focus:outline-none focus:ring-primary focus:border-primary sm:text-sm"/>
              </div>
              <div>
                <label htmlFor="new-password" className="block text-sm font-medium text-on-surface-variant">New Password</label>
                <input type="password" id="new-password" value={newPassword} onChange={e => setNewPassword(e.target.value)} required className="mt-1 block w-full px-3 py-2 border border-gray-600 bg-gray-700 text-on-surface rounded-md shadow-sm focus:outline-none focus:ring-primary focus:border-primary sm:text-sm"/>
              </div>
               <div>
                <label htmlFor="confirm-password" className="block text-sm font-medium text-on-surface-variant">Confirm New Password</label>
                <input type="password" id="confirm-password" value={confirmPassword} onChange={e => setConfirmPassword(e.target.value)} required className="mt-1 block w-full px-3 py-2 border border-gray-600 bg-gray-700 text-on-surface rounded-md shadow-sm focus:outline-none focus:ring-primary focus:border-primary sm:text-sm"/>
              </div>
             <div className="text-right pt-2">
              <button type="submit" className="inline-flex justify-center py-2 px-4 border border-transparent shadow-sm text-sm font-medium rounded-md text-white bg-primary hover:bg-primary/90">
                Update Password
              </button>
            </div>
          </form>
        </div>
      )}

      {/* Info for Google OAuth users */}
      {!user.hasPassword && (
        <div className="bg-surface p-8 rounded-lg shadow">
          <h2 className="text-xl font-semibold mb-6">Account Security</h2>
          <div className="bg-blue-50 border border-blue-200 rounded-md p-4">
            <div className="flex">
              <div className="flex-shrink-0">
                <svg className="h-5 w-5 text-blue-400" viewBox="0 0 20 20" fill="currentColor">
                  <path fillRule="evenodd" d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7-4a1 1 0 11-2 0 1 1 0 012 0zM9 9a1 1 0 000 2v3a1 1 0 001 1h1a1 1 0 100-2v-3a1 1 0 00-1-1H9z" clipRule="evenodd" />
                </svg>
              </div>
              <div className="ml-3">
                <h3 className="text-sm font-medium text-blue-800">
                  Google Account Security
                </h3>
                <div className="mt-2 text-sm text-blue-700">
                  <p>Your account is secured through Google. To change your password or update security settings, please visit your Google Account settings.</p>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Subscription Management */}
      <div className="bg-surface p-8 rounded-lg shadow">
        <h2 className="text-xl font-semibold mb-6">Manage Subscription</h2>
        <div className="grid md:grid-cols-3 gap-6 text-center">
            {(['FREE', 'PRO', 'ENTERPRISE'] as SubscriptionPlan[]).map(plan => {
                const isCurrentPlan = user.subscription === plan;
                const isUpgrade = planOrder[plan] > planOrder[user.subscription];
                const isDisabled = isCurrentPlan || !isUpgrade;
                
                let buttonText = 'Upgrade';
                if (isCurrentPlan) buttonText = 'Current Plan';
                else if (!isUpgrade) buttonText = 'Downgrade Not Allowed';

                return (
                    <div key={plan} className={`p-6 rounded-lg border-2 ${isCurrentPlan ? 'border-primary' : 'border-gray-600'}`}>
                        <h3 className="text-lg font-semibold capitalize">{plan.toLowerCase()}</h3>
                        <p className="text-on-surface-variant my-4 text-sm h-10">
                            {plan === 'FREE' && 'Basic features with a limit of 5 generations.'}
                            {plan === 'PRO' && PLAN_DETAILS.PRO.benefits}
                            {plan === 'ENTERPRISE' && PLAN_DETAILS.ENTERPRISE.benefits}
                        </p>
                        <button
                            onClick={() => handleSubscriptionChange(plan)}
                            disabled={isDisabled}
                            className="w-full py-2 px-4 rounded-md text-sm font-medium transition-colors disabled:bg-primary disabled:cursor-not-allowed disabled:text-white bg-gray-700 text-on-surface enabled:hover:bg-primary enabled:hover:text-white"
                        >
                            {buttonText}
                        </button>
                    </div>
                );
            })}
        </div>
      </div>

      {/* Modal for payment */}
      <Modal 
          isOpen={isModalOpen && !!selectedPlan && selectedPlan !== 'FREE'} 
          onClose={() => setIsModalOpen(false)}
          title={`Upgrade to ${selectedPlan} Plan`}
      >
          {selectedPlan && selectedPlan !== 'FREE' && (
              <div className="text-center">
                  <p className="text-on-surface-variant mb-4">{PLAN_DETAILS[selectedPlan].description}</p>
                  <div className="my-6">
                      <p className="text-sm text-on-surface-variant">Total Cost (Pay as you go)</p>
                      <p className="text-4xl font-bold text-on-surface">${PLAN_DETAILS[selectedPlan].price}</p>
                  </div>
                  <div className="flex justify-center my-6">
                      <img 
                          src={`https://api.qrserver.com/v1/create-qr-code/?size=150x150&data=payment-for-mvpgen-${selectedPlan}-plan-cost-${PLAN_DETAILS[selectedPlan].price}`} 
                          alt="QR Code for payment" 
                          className="bg-white p-2 rounded-lg"
                      />
                  </div>
                  <p className="text-xs text-on-surface-variant mb-6">Scan the QR code with your payment app to complete the transaction.</p>
                  <button
                      onClick={handleConfirmUpgrade}
                      className="w-full py-2 px-4 rounded-md text-sm font-medium text-white bg-secondary hover:bg-secondary/90"
                  >
                      I have completed the payment
                  </button>
              </div>
          )}
      </Modal>
    </div>
  );
};

export default ProfileSettingsPage;
