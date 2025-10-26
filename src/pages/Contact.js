import './Contact.css';


function Contact() {
  return (
    <div className="contact-page">
      <section className="contact-hero-section">
        <h1>Contact Us</h1>
        <p>We'd love to hear from you! Reach out to us through any of the methods below.</p>
      </section>

      <section className="contact-info-section">
        <div className="contact-card">
          <h3>General Inquiries</h3>
          <p>Email: info@provinggrounds.com</p>
          <p>Phone: +1 (555) 123-4567</p>
        </div>
        <div className="contact-card">
          <h3>Technical Support</h3>
          <p>Email: support@provinggrounds.com</p>
          <p>Phone: +1 (555) 987-6543</p>
        </div>
        <div className="contact-card">
          <h3>Partnerships</h3>
          <p>Email: partnerships@provinggrounds.com</p>
          <p>Phone: +1 (555) 246-8000</p>
        </div>
      </section>

      <section className="contact-form-section">
        <h2>Send Us a Message</h2>
        <form className="contact-form">
          <div className="form-group">
            <label htmlFor="name">Name:</label>
            <input type="text" id="name" name="name" required />
          </div>
          <div className="form-group">
            <label htmlFor="email">Email:</label>
            <input type="email" id="email" name="email" required />
          </div>
          <div className="form-group">
            <label htmlFor="subject">Subject:</label>
            <input type="text" id="subject" name="subject" required />
          </div>
          <div className="form-group">
            <label htmlFor="message">Message:</label>
            <textarea id="message" name="message" rows="5" required></textarea>
          </div>
          <button type="submit" className="cta-button">Send Message</button>
        </form>
      </section>
    </div>
  );
}

export default Contact;