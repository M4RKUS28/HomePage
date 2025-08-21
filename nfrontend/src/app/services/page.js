export default function Services() {
  const services = [
    {
      title: "Web Application Development",
      description: "Custom web applications built with modern frameworks and best practices",
      features: [
        "React & Next.js Applications",
        "Responsive Design",
        "Performance Optimization",
        "SEO Implementation"
      ],
      icon: "💻"
    },
    {
      title: "Backend API Development",
      description: "Robust and scalable backend services and RESTful APIs",
      features: [
        "FastAPI & Python",
        "Database Design",
        "Authentication & Security",
        "API Documentation"
      ],
      icon: "🔧"
    },
    {
      title: "Full-Stack Solutions",
      description: "Complete end-to-end web solutions from concept to deployment",
      features: [
        "Architecture Planning",
        "Frontend & Backend Integration",
        "Database Management",
        "Deployment & Hosting"
      ],
      icon: "🚀"
    },
    {
      title: "E-Commerce Development",
      description: "Custom e-commerce platforms and online store solutions",
      features: [
        "Shopping Cart Integration",
        "Payment Processing",
        "Inventory Management",
        "Order Tracking"
      ],
      icon: "🛒"
    },
    {
      title: "Website Modernization",
      description: "Upgrade legacy websites with modern technologies and improved UX",
      features: [
        "Legacy System Migration",
        "Performance Improvements",
        "Mobile Responsiveness",
        "Security Updates"
      ],
      icon: "⚡"
    },
    {
      title: "Consultation & Support",
      description: "Technical consultation and ongoing maintenance services",
      features: [
        "Code Review",
        "Performance Audits",
        "Technical Documentation",
        "Ongoing Support"
      ],
      icon: "👥"
    }
  ];

  return (
    <div className="min-h-screen py-20">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        {/* Header */}
        <div className="text-center mb-16">
          <h1 className="text-4xl md:text-5xl font-bold text-gray-900 mb-6">
            My Services
          </h1>
          <p className="text-xl text-gray-600 max-w-3xl mx-auto">
            I offer comprehensive web development services tailored to help businesses 
            succeed in the digital landscape
          </p>
        </div>

        {/* Services Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8 mb-20">
          {services.map((service, index) => (
            <div key={index} className="bg-white rounded-lg border border-gray-200 p-6 hover:shadow-lg transition-shadow">
              <div className="text-4xl mb-4">{service.icon}</div>
              <h3 className="text-xl font-semibold text-gray-900 mb-3">
                {service.title}
              </h3>
              <p className="text-gray-600 mb-4">
                {service.description}
              </p>
              <ul className="space-y-2">
                {service.features.map((feature, featureIndex) => (
                  <li key={featureIndex} className="flex items-center text-sm text-gray-600">
                    <svg className="w-4 h-4 text-blue-500 mr-2" fill="currentColor" viewBox="0 0 20 20">
                      <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
                    </svg>
                    {feature}
                  </li>
                ))}
              </ul>
            </div>
          ))}
        </div>

        {/* Process Section */}
        <div className="bg-gray-50 rounded-lg p-8 mb-20">
          <h2 className="text-3xl font-bold text-center text-gray-900 mb-12">
            My Development Process
          </h2>
          <div className="grid grid-cols-1 md:grid-cols-4 gap-8">
            <div className="text-center">
              <div className="w-16 h-16 bg-blue-100 rounded-full flex items-center justify-center mx-auto mb-4">
                <span className="text-2xl font-bold text-blue-600">1</span>
              </div>
              <h3 className="font-semibold mb-2">Discovery</h3>
              <p className="text-gray-600 text-sm">
                Understanding your requirements and project goals
              </p>
            </div>
            <div className="text-center">
              <div className="w-16 h-16 bg-blue-100 rounded-full flex items-center justify-center mx-auto mb-4">
                <span className="text-2xl font-bold text-blue-600">2</span>
              </div>
              <h3 className="font-semibold mb-2">Planning</h3>
              <p className="text-gray-600 text-sm">
                Creating detailed project roadmap and architecture
              </p>
            </div>
            <div className="text-center">
              <div className="w-16 h-16 bg-blue-100 rounded-full flex items-center justify-center mx-auto mb-4">
                <span className="text-2xl font-bold text-blue-600">3</span>
              </div>
              <h3 className="font-semibold mb-2">Development</h3>
              <p className="text-gray-600 text-sm">
                Building your solution with regular updates and feedback
              </p>
            </div>
            <div className="text-center">
              <div className="w-16 h-16 bg-blue-100 rounded-full flex items-center justify-center mx-auto mb-4">
                <span className="text-2xl font-bold text-blue-600">4</span>
              </div>
              <h3 className="font-semibold mb-2">Deployment</h3>
              <p className="text-gray-600 text-sm">
                Launching your project with ongoing support
              </p>
            </div>
          </div>
        </div>

        {/* CTA Section */}
        <div className="text-center bg-blue-600 rounded-lg p-8 text-white">
          <h2 className="text-2xl font-bold mb-4">
            Ready to Start Your Project?
          </h2>
          <p className="mb-6">
            Let&apos;s discuss how I can help bring your ideas to life
          </p>
          <a
            href="/contact"
            className="bg-white text-blue-600 px-8 py-3 rounded-lg font-semibold hover:bg-gray-100 transition-colors inline-block"
          >
            Contact Me Today
          </a>
        </div>
      </div>
    </div>
  );
}
