export default function About() {
  return (
    <div className="min-h-screen py-20">
      <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="text-center mb-16">
          <h1 className="text-4xl md:text-5xl font-bold text-gray-900 mb-6">
            About Me
          </h1>
          <p className="text-xl text-gray-600">
            Passionate full-stack developer with a love for creating innovative web solutions
          </p>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-12 items-center mb-20">
          <div>
            <h2 className="text-2xl font-bold text-gray-900 mb-6">My Story</h2>
            <div className="space-y-4 text-gray-600">
              <p>
                With over 5 years of experience in web development, I&apos;ve had the privilege 
                of working on diverse projects ranging from small business websites to 
                large-scale enterprise applications.
              </p>
              <p>
                My journey began with a curiosity about how websites work, which quickly 
                evolved into a passion for creating seamless user experiences and robust 
                backend systems.
              </p>
              <p>
                I believe in the power of clean code, thoughtful design, and continuous 
                learning to deliver exceptional digital solutions.
              </p>
            </div>
          </div>
          <div className="bg-gray-100 rounded-lg p-8">
            <h3 className="text-xl font-semibold mb-4">Quick Facts</h3>
            <ul className="space-y-2 text-gray-600">
              <li>🎓 Computer Science Graduate</li>
              <li>💼 5+ Years Professional Experience</li>
              <li>🌍 Based in Germany</li>
              <li>⚡ React & Next.js Specialist</li>
              <li>🐍 Python & FastAPI Expert</li>
              <li>☁️ Cloud Infrastructure Enthusiast</li>
            </ul>
          </div>
        </div>

        <div className="mb-20">
          <h2 className="text-3xl font-bold text-center text-gray-900 mb-12">
            Skills & Technologies
          </h2>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
            <div>
              <h3 className="text-xl font-semibold mb-4 text-blue-600">Frontend</h3>
              <ul className="space-y-2 text-gray-600">
                <li>React.js & Next.js</li>
                <li>TypeScript</li>
                <li>Tailwind CSS</li>
                <li>HTML5 & CSS3</li>
                <li>JavaScript (ES6+)</li>
              </ul>
            </div>
            <div>
              <h3 className="text-xl font-semibold mb-4 text-green-600">Backend</h3>
              <ul className="space-y-2 text-gray-600">
                <li>Python & FastAPI</li>
                <li>Node.js & Express</li>
                <li>PostgreSQL & MongoDB</li>
                <li>RESTful APIs</li>
                <li>Authentication & Security</li>
              </ul>
            </div>
            <div>
              <h3 className="text-xl font-semibold mb-4 text-purple-600">DevOps</h3>
              <ul className="space-y-2 text-gray-600">
                <li>Docker & Docker Compose</li>
                <li>Git & GitHub</li>
                <li>CI/CD Pipelines</li>
                <li>Cloud Deployment</li>
                <li>Performance Optimization</li>
              </ul>
            </div>
          </div>
        </div>

        <div className="text-center bg-blue-50 rounded-lg p-8">
          <h2 className="text-2xl font-bold text-gray-900 mb-4">
            Let&apos;s Work Together
          </h2>
          <p className="text-gray-600 mb-6">
            I'm always excited to take on new challenges and collaborate on interesting projects.
          </p>
          <a
            href="/contact"
            className="bg-blue-600 text-white px-8 py-3 rounded-lg font-semibold hover:bg-blue-700 transition-colors inline-block"
          >
            Get in Touch
          </a>
        </div>
      </div>
    </div>
  );
}
