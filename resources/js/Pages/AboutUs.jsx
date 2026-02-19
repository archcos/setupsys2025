import { useState } from 'react';
import { Head, Link } from '@inertiajs/react';
import { 
  Target, 
  Lightbulb, 
  TrendingUp, 
  Users, 
  Award, 
  Zap,
  CheckCircle2,
  ArrowRight,
  Globe
} from 'lucide-react';
import logo from '../../assets/logo.webp';
import setupLogo from '../../assets/SETUP_logo.webp';

export default function AboutSetup() {
  const [activeTab, setActiveTab] = useState('mission');

  const benefits = [
    {
      icon: Lightbulb,
      title: 'Technology Innovation',
      description: 'Access to cutting-edge technology solutions tailored for your business needs'
    },
    {
      icon: TrendingUp,
      title: 'Business Growth',
      description: 'Increase productivity and operational efficiency through strategic tech adoption'
    },
    {
      icon: Users,
      title: 'Expert Support',
      description: 'Dedicated assistance from DOST specialists throughout your journey'
    },
    {
      icon: Globe,
      title: 'Market Competitiveness',
      description: 'Enhance your position in both local and international markets'
    }
  ];

  const programPhases = [
    {
      number: '01',
      title: 'Assessment',
      description: 'Comprehensive evaluation of your current operations and technology needs'
    },
    {
      number: '02',
      title: 'Recommendation',
      description: 'Customized technology solutions based on your business requirements'
    },
    {
      number: '03',
      title: 'Implementation',
      description: 'Support and guidance through the adoption and integration process'
    },
    {
      number: '04',
      title: 'Monitoring',
      description: 'Continuous support and performance tracking to ensure success'
    }
  ];

  const stats = [
    { number: '1000+', label: 'MSMEs Supported' },
    { number: '15+', label: 'Years of Service' },
    { number: '50%', label: 'Avg. Productivity Increase' },
    { number: '₱500M', label: 'Total Investment' }
  ];

  return (
    <div className="min-h-screen bg-white">
      <Head title="About SETUP - DOST" />

      {/* Navigation Bar */}
      <nav className="sticky top-0 z-40 bg-white border-b border-gray-100 backdrop-blur-sm bg-white/95">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center h-16">
            <Link href="/" className="flex items-center gap-3">
              <img src={logo} alt="DOST Logo" className="w-10 h-10 object-contain" />
              <img src={setupLogo} alt="SETUP Logo" className="h-10 object-contain" />
            </Link>
            <div className="flex items-center gap-8">
              <Link href="/about" className="text-gray-900 font-medium text-sm">About</Link>
              <Link href="/contact" className="text-sm text-gray-600 hover:text-gray-900">Contact</Link>
              <button className="px-4 py-2 bg-blue-600 text-white rounded-lg text-sm font-medium hover:bg-blue-700 transition">
                Get Started
              </button>
            </div>
          </div>
        </div>
      </nav>

      {/* Hero Section */}
      <section className="relative overflow-hidden bg-gradient-to-b from-blue-50 via-white to-white pt-20 pb-32">
        <div className="absolute top-0 right-0 w-96 h-96 bg-blue-100 rounded-full mix-blend-multiply filter blur-3xl opacity-20 -mr-48 -mt-48"></div>
        <div className="absolute bottom-0 left-0 w-96 h-96 bg-indigo-100 rounded-full mix-blend-multiply filter blur-3xl opacity-20 -ml-48 -mb-48"></div>
        
        <div className="relative max-w-5xl mx-auto px-4 text-center">
          <div className="mb-8 inline-block">
            <span className="px-4 py-2 bg-blue-100 text-blue-700 rounded-full text-sm font-semibold">
              Supporting Philippine MSMEs Since 2009
            </span>
          </div>
          
          <h1 className="text-5xl lg:text-6xl font-bold text-gray-900 mb-6 leading-tight">
            Empowering MSMEs Through <span className="text-transparent bg-clip-text bg-gradient-to-r from-blue-600 to-indigo-600">Technology</span>
          </h1>
          
          <p className="text-xl text-gray-600 max-w-3xl mx-auto leading-relaxed mb-12">
            The Small Enterprise Technology Upgrading Program (SETUP) is the Department of Science and Technology's flagship initiative to help micro, small, and medium enterprises adopt innovative technologies and compete globally.
          </p>

          <div className="flex flex-wrap gap-4 justify-center">
            <button className="px-8 py-3 bg-blue-600 text-white rounded-lg font-semibold hover:bg-blue-700 transition flex items-center gap-2">
              Learn More <ArrowRight size={18} />
            </button>
            <Link href="/contact" className="px-8 py-3 border-2 border-gray-300 text-gray-900 rounded-lg font-semibold hover:border-gray-400 transition">
              Get In Touch
            </Link>
          </div>
        </div>
      </section>

      {/* Stats Section */}
      <section className="max-w-7xl mx-auto px-4 py-16 mb-16">
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-8">
          {stats.map((stat, index) => (
            <div key={index} className="text-center">
              <div className="text-3xl lg:text-4xl font-bold text-blue-600 mb-2">{stat.number}</div>
              <div className="text-gray-600 text-sm lg:text-base">{stat.label}</div>
            </div>
          ))}
        </div>
      </section>

      {/* Mission, Vision, Values */}
      <section className="bg-gray-50 py-20">
        <div className="max-w-6xl mx-auto px-4">
          <div className="text-center mb-16">
            <h2 className="text-4xl font-bold text-gray-900 mb-4">Our Foundation</h2>
            <p className="text-gray-600 text-lg">Guided by a clear vision and driven by core values</p>
          </div>

          <div className="grid md:grid-cols-3 gap-8">
            {/* Mission */}
            <div className="bg-white rounded-2xl shadow-lg p-8 hover:shadow-xl transition border-l-4 border-blue-600">
              <div className="flex items-center gap-3 mb-4">
                <Target className="w-8 h-8 text-blue-600" />
                <h3 className="text-2xl font-bold text-gray-900">Mission</h3>
              </div>
              <p className="text-gray-600 leading-relaxed">
                To facilitate technology adoption and innovation among MSMEs, enabling them to enhance productivity, improve product quality, and expand their market reach nationally and internationally.
              </p>
            </div>

            {/* Vision */}
            <div className="bg-white rounded-2xl shadow-lg p-8 hover:shadow-xl transition border-l-4 border-indigo-600">
              <div className="flex items-center gap-3 mb-4">
                <Lightbulb className="w-8 h-8 text-indigo-600" />
                <h3 className="text-2xl font-bold text-gray-900">Vision</h3>
              </div>
              <p className="text-gray-600 leading-relaxed">
                A nation of globally competitive MSMEs driven by innovation, technology, and entrepreneurial excellence that contribute significantly to economic growth and national development.
              </p>
            </div>

            {/* Values */}
            <div className="bg-white rounded-2xl shadow-lg p-8 hover:shadow-xl transition border-l-4 border-green-600">
              <div className="flex items-center gap-3 mb-4">
                <Award className="w-8 h-8 text-green-600" />
                <h3 className="text-2xl font-bold text-gray-900">Core Values</h3>
              </div>
              <ul className="space-y-2 text-gray-600">
                <li className="flex items-center gap-2">
                  <CheckCircle2 size={18} className="text-green-600 flex-shrink-0" />
                  Innovation & Excellence
                </li>
                <li className="flex items-center gap-2">
                  <CheckCircle2 size={18} className="text-green-600 flex-shrink-0" />
                  Partnership & Collaboration
                </li>
                <li className="flex items-center gap-2">
                  <CheckCircle2 size={18} className="text-green-600 flex-shrink-0" />
                  Integrity & Transparency
                </li>
              </ul>
            </div>
          </div>
        </div>
      </section>

      {/* Key Benefits */}
      <section className="py-20 max-w-6xl mx-auto px-4">
        <div className="text-center mb-16">
          <h2 className="text-4xl font-bold text-gray-900 mb-4">Why Choose SETUP?</h2>
          <p className="text-gray-600 text-lg max-w-2xl mx-auto">
            We provide comprehensive support to help your business thrive in the digital economy
          </p>
        </div>

        <div className="grid md:grid-cols-2 gap-8">
          {benefits.map((benefit, index) => {
            const IconComponent = benefit.icon;
            return (
              <div key={index} className="bg-white border border-gray-200 rounded-2xl p-8 hover:border-blue-400 hover:shadow-lg transition">
                <div className="flex items-start gap-4">
                  <div className="bg-blue-100 p-4 rounded-xl flex-shrink-0">
                    <IconComponent className="w-6 h-6 text-blue-600" />
                  </div>
                  <div>
                    <h3 className="text-xl font-bold text-gray-900 mb-2">{benefit.title}</h3>
                    <p className="text-gray-600">{benefit.description}</p>
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      </section>

      {/* Program Phases */}
      <section className="bg-gray-50 py-20">
        <div className="max-w-6xl mx-auto px-4">
          <div className="text-center mb-16">
            <h2 className="text-4xl font-bold text-gray-900 mb-4">How SETUP Works</h2>
            <p className="text-gray-600 text-lg">A structured approach to your success</p>
          </div>

          <div className="grid md:grid-cols-4 gap-6">
            {programPhases.map((phase, index) => (
              <div key={index} className="relative">
                <div className="bg-white rounded-xl p-6 h-full shadow-md hover:shadow-lg transition">
                  <div className="text-5xl font-bold text-blue-100 mb-4">{phase.number}</div>
                  <h3 className="text-xl font-bold text-gray-900 mb-3">{phase.title}</h3>
                  <p className="text-gray-600 text-sm leading-relaxed">{phase.description}</p>
                </div>
                
                {index < programPhases.length - 1 && (
                  <div className="hidden md:block absolute top-1/2 -right-3 w-6 h-0.5 bg-blue-300"></div>
                )}
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Eligibility Section */}
      <section className="py-20 max-w-6xl mx-auto px-4">
        <div className="bg-gradient-to-r from-blue-600 to-indigo-600 rounded-3xl p-12 text-white">
          <h2 className="text-3xl font-bold mb-8">Who Can Benefit?</h2>
          
          <div className="grid md:grid-cols-2 gap-8">
            <div>
              <h3 className="text-xl font-semibold mb-4 flex items-center gap-2">
                <Zap className="w-5 h-5" />
                Enterprise Size
              </h3>
              <ul className="space-y-3">
                <li className="flex items-center gap-3">
                  <CheckCircle2 size={20} />
                  <span>Micro enterprises (≤9 employees)</span>
                </li>
                <li className="flex items-center gap-3">
                  <CheckCircle2 size={20} />
                  <span>Small enterprises (10-99 employees)</span>
                </li>
                <li className="flex items-center gap-3">
                  <CheckCircle2 size={20} />
                  <span>Medium enterprises (100-199 employees)</span>
                </li>
              </ul>
            </div>

            <div>
              <h3 className="text-xl font-semibold mb-4 flex items-center gap-2">
                <Target className="w-5 h-5" />
                Requirements
              </h3>
              <ul className="space-y-3">
                <li className="flex items-center gap-3">
                  <CheckCircle2 size={20} />
                  <span>Registered business with DTI/SEC</span>
                </li>
                <li className="flex items-center gap-3">
                  <CheckCircle2 size={20} />
                  <span>Operating for at least 1 year</span>
                </li>
                <li className="flex items-center gap-3">
                  <CheckCircle2 size={20} />
                  <span>Willing to adopt technology solutions</span>
                </li>
              </ul>
            </div>
          </div>
        </div>
      </section>

      {/* CTA Section */}
      <section className="py-20 max-w-6xl mx-auto px-4 text-center">
        <h2 className="text-4xl font-bold text-gray-900 mb-6">Ready to Transform Your Business?</h2>
        <p className="text-xl text-gray-600 mb-10 max-w-2xl mx-auto">
          Join thousands of Philippine MSMEs that have already embraced technology and scaled their operations.
        </p>
        
        <div className="flex flex-wrap gap-4 justify-center">
          <Link href="/contact" className="px-8 py-3 bg-blue-600 text-white rounded-lg font-semibold hover:bg-blue-700 transition flex items-center gap-2">
            Get In Touch <ArrowRight size={18} />
          </Link>
          <button className="px-8 py-3 border-2 border-blue-600 text-blue-600 rounded-lg font-semibold hover:bg-blue-50 transition">
            Request Information
          </button>
        </div>
      </section>

      {/* Footer */}
      <footer className="bg-gray-900 text-gray-300 py-12">
        <div className="max-w-6xl mx-auto px-4">
          <div className="grid md:grid-cols-4 gap-8 mb-8">
            <div>
              <h4 className="text-white font-semibold mb-4">About SETUP</h4>
              <p className="text-sm text-gray-400">Empowering Philippine MSMEs through technology innovation and strategic support.</p>
            </div>
            <div>
              <h4 className="text-white font-semibold mb-4">Quick Links</h4>
              <ul className="space-y-2 text-sm">
                <li><Link href="/about" className="text-gray-400 hover:text-white transition">About</Link></li>
                <li><Link href="/contact" className="text-gray-400 hover:text-white transition">Contact</Link></li>
                <li><a href="#" className="text-gray-400 hover:text-white transition">Programs</a></li>
                <li><a href="#" className="text-gray-400 hover:text-white transition">Resources</a></li>
              </ul>
            </div>
            <div>
              <h4 className="text-white font-semibold mb-4">Contact</h4>
              <ul className="space-y-2 text-sm text-gray-400">
                <li>+63 88 856-1889</li>
                <li>setup@region10.dost.gov.ph</li>
                <li>Cagayan de Oro City</li>
              </ul>
            </div>
            <div>
              <h4 className="text-white font-semibold mb-4">Follow Us</h4>
              <div className="flex gap-4">
                <a href="#" className="text-gray-400 hover:text-white transition">Facebook</a>
                <a href="#" className="text-gray-400 hover:text-white transition">LinkedIn</a>
                <a href="#" className="text-gray-400 hover:text-white transition">Twitter</a>
              </div>
            </div>
          </div>
          
          <div className="border-t border-gray-800 pt-8 text-center text-sm text-gray-400">
            <p>&copy; 2024 DOST SETUP Program. All rights reserved.</p>
          </div>
        </div>
      </footer>

      {/* Custom CSS for animations */}
      <style>{`
        @keyframes float {
          0%, 100% { transform: translateY(0px); }
          50% { transform: translateY(-10px); }
        }
        
        @keyframes slideInUp {
          from {
            opacity: 0;
            transform: translateY(30px);
          }
          to {
            opacity: 1;
            transform: translateY(0);
          }
        }
      `}</style>
    </div>
  );
}

AboutSetup.layout = null;