import { useState } from 'react';
import axios from 'axios';
import { Mail, Phone, MapPin, Clock, Send, ShieldCheck, CheckCircle2 } from 'lucide-react';

const Contact = () => {
  const [formData, setFormData] = useState({
    name: '',
    email: '',
    subject: '',
    message: ''
  });
  const [submitted, setSubmitted] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setIsSubmitting(true);
    
    try {
      const response = await axios.post('/api/v1/contact', formData);

      if (response.status === 200 || response.data?.success) {
        setSubmitted(true);
        setFormData({ name: '', email: '', subject: '', message: '' });
      } else {
        alert(response.data?.message || 'Failed to send secure message. Please try again.');
      }
    } catch (error) {
      console.error('Contact Form Error:', error);
      alert(error.response?.data?.message || 'An error occurred while sending your message. Please try again.');
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="min-h-[calc(100vh-80px)] bg-background py-16 transition-all duration-300">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        
        {/* Title Header */}
        <div className="text-center max-w-3xl mx-auto mb-16">
          <h1 className="text-4xl font-extrabold tracking-tight text-on-surface sm:text-5xl mb-4 font-display">
            Get in Touch with <span className="text-primary font-display">ClaimLens</span>
          </h1>
          <p className="text-lg text-on-surface-variant">
            Have questions about our AI pipeline, API integration, or enterprise credibility auditing? We are here to help.
          </p>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-10 items-start">
          
          {/* Left Column (Col-span-1): Office Info Cards */}
          <div className="space-y-6">
            
            {/* Quick Contact Info */}
            <div className="bg-surface-container-lowest border border-outline-variant rounded-3xl p-8 shadow-sm">
              <h2 className="text-xl font-bold text-on-surface mb-6 font-display flex items-center gap-2">
                <ShieldCheck className="h-6 w-6 text-primary animate-pulse" />
                Contact Info
              </h2>
              
              <ul className="space-y-6 text-sm">
                <li className="flex items-start gap-4">
                  <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-primary/10 border border-primary/20 text-primary flex-shrink-0">
                    <Mail className="h-5 w-5" />
                  </div>
                  <div>
                    <h3 className="font-semibold text-on-surface">Email Us</h3>
                    <p className="text-on-surface-variant mt-1">support@claimlens.ai</p>
                    <p className="text-xs text-primary mt-0.5">Average response time: &lt; 2 hours</p>
                  </div>
                </li>

                <li className="flex items-start gap-4">
                  <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-primary/10 border border-primary/20 text-primary flex-shrink-0">
                    <Phone className="h-5 w-5" />
                  </div>
                  <div>
                    <h3 className="font-semibold text-on-surface">Call Center</h3>
                    <p className="text-on-surface-variant mt-1">+1 (800) 555-CLAIM</p>
                    <p className="text-xs text-on-surface-variant mt-0.5">Mon-Fri, 9:00 AM - 6:00 PM EST</p>
                  </div>
                </li>

                <li className="flex items-start gap-4">
                  <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-primary/10 border border-primary/20 text-primary flex-shrink-0">
                    <MapPin className="h-5 w-5" />
                  </div>
                  <div>
                    <h3 className="font-semibold text-on-surface">Headquarters</h3>
                    <p className="text-on-surface-variant mt-1">100 Innovation Way, Suite 400</p>
                    <p className="text-on-surface-variant">Silicon Valley, CA 94025</p>
                  </div>
                </li>

                <li className="flex items-start gap-4">
                  <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-primary/10 border border-primary/20 text-primary flex-shrink-0">
                    <Clock className="h-5 w-5" />
                  </div>
                  <div>
                    <h3 className="font-semibold text-on-surface">Office Hours</h3>
                    <p className="text-on-surface-variant mt-1">Monday - Friday</p>
                    <p className="text-on-surface-variant">9:00 AM - 6:00 PM UTC-8</p>
                  </div>
                </li>
              </ul>
            </div>

            {/* Premium Note */}
            <div className="bg-gradient-to-br from-primary/10 to-surface-container border border-primary/25 rounded-3xl p-8 shadow-sm">
              <h3 className="font-bold text-primary font-display mb-2">Developer API Support</h3>
              <p className="text-xs text-on-surface-variant leading-relaxed">
                Looking to automate keyframe visual audit verification on thousands of programmatic ads? Contact our specialized dev integration division directly at <span className="font-semibold text-primary">api@claimlens.ai</span>.
              </p>
            </div>

          </div>

          {/* Right/Col-span-2: Interactive Contact Form Container */}
          <div className="lg:col-span-2 bg-surface-container-lowest border border-outline-variant rounded-3xl p-8 shadow-md">
            
            {submitted ? (
              <div className="py-12 text-center">
                <div className="mx-auto flex h-16 w-16 items-center justify-center rounded-2xl bg-emerald-500/10 border border-emerald-500/20 text-emerald-600 mb-6 animate-bounce">
                  <CheckCircle2 className="h-10 w-10" />
                </div>
                <h2 className="text-2xl font-bold text-on-surface mb-2 font-display">Message Sent Successfully!</h2>
                <p className="text-on-surface-variant text-sm max-w-md mx-auto mb-8">
                  Thank you for contacting the ClaimLens team. An audit specialist will reach out to your provided email address shortly.
                </p>
                <button
                  onClick={() => setSubmitted(false)}
                  className="inline-flex items-center justify-center px-6 py-2.5 rounded-xl text-sm font-semibold bg-primary hover:bg-primary-hover text-white transition-colors shadow-sm"
                >
                  Send Another Message
                </button>
              </div>
            ) : (
              <form onSubmit={handleSubmit} className="space-y-6">
                <h2 className="text-2xl font-bold text-on-surface font-display border-b border-outline-variant pb-4">
                  Send a Secure Message
                </h2>
                
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
                  <div>
                    <label className="block text-sm font-semibold text-on-surface">Full Name</label>
                    <input
                      type="text"
                      required
                      placeholder="Jane Doe"
                      value={formData.name}
                      onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                      className="mt-2 appearance-none block w-full px-4 py-3 border border-outline-variant rounded-xl shadow-sm placeholder-on-surface-variant/40 bg-surface-container-low text-on-surface focus:outline-none focus:ring-2 focus:ring-primary focus:border-transparent transition-all sm:text-sm"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-semibold text-on-surface">Email Address</label>
                    <input
                      type="email"
                      required
                      placeholder="jane@example.com"
                      value={formData.email}
                      onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                      className="mt-2 appearance-none block w-full px-4 py-3 border border-outline-variant rounded-xl shadow-sm placeholder-on-surface-variant/40 bg-surface-container-low text-on-surface focus:outline-none focus:ring-2 focus:ring-primary focus:border-transparent transition-all sm:text-sm"
                    />
                  </div>
                </div>

                <div>
                  <label className="block text-sm font-semibold text-on-surface">Subject</label>
                  <input
                    type="text"
                    required
                    placeholder="Ad Credibility API Request"
                    value={formData.subject}
                    onChange={(e) => setFormData({ ...formData, subject: e.target.value })}
                    className="mt-2 appearance-none block w-full px-4 py-3 border border-outline-variant rounded-xl shadow-sm placeholder-on-surface-variant/40 bg-surface-container-low text-on-surface focus:outline-none focus:ring-2 focus:ring-primary focus:border-transparent transition-all sm:text-sm"
                  />
                </div>

                <div>
                  <label className="block text-sm font-semibold text-on-surface">Message Body</label>
                  <textarea
                    rows="6"
                    required
                    placeholder="Describe how we can assist your campaign auditing needs..."
                    value={formData.message}
                    onChange={(e) => setFormData({ ...formData, message: e.target.value })}
                    className="mt-2 appearance-none block w-full px-4 py-3 border border-outline-variant rounded-xl shadow-sm placeholder-on-surface-variant/40 bg-surface-container-low text-on-surface focus:outline-none focus:ring-2 focus:ring-primary focus:border-transparent transition-all sm:text-sm resize-none"
                  />
                </div>

                <div>
                  <button
                    type="submit"
                    disabled={isSubmitting}
                    className="w-full flex justify-center items-center py-3.5 px-4 border border-transparent rounded-xl shadow-md shadow-primary/10 text-sm font-semibold text-white bg-primary hover:bg-primary-hover focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-primary transition-all disabled:opacity-70 group"
                  >
                    {isSubmitting ? (
                      <div className="animate-spin rounded-full h-5 w-5 border-2 border-white border-t-transparent"></div>
                    ) : (
                      <>
                        Send Message 
                        <Send className="ml-2 h-4 w-4 group-hover:translate-x-0.5 transition-transform" />
                      </>
                    )}
                  </button>
                </div>
              </form>
            )}

          </div>

        </div>

      </div>
    </div>
  );
};

export default Contact;
