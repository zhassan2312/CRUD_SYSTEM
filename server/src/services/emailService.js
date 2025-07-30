import fs from 'fs/promises';
import path from 'path';
import { fileURLToPath } from 'url';
import { addDoc, Timestamp } from 'firebase/firestore';
import { mail } from '../config/firebase.config.js';
import { EMAIL_TEMPLATE_TYPES, STATUS_COLORS } from '../constants/notifications.js';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

class EmailService {
  constructor() {
    this.templatesPath = path.join(__dirname, '..', 'templates', 'email');
    this.templateCache = new Map();
  }

  /**
   * Load and cache email template
   * @param {string} templateName - Name of the template file
   * @returns {Promise<string>} Template content
   */
  async loadTemplate(templateName) {
    if (this.templateCache.has(templateName)) {
      return this.templateCache.get(templateName);
    }

    try {
      const templatePath = path.join(this.templatesPath, `${templateName}.html`);
      const templateContent = await fs.readFile(templatePath, 'utf8');
      this.templateCache.set(templateName, templateContent);
      return templateContent;
    } catch (error) {
      console.error(`Failed to load email template: ${templateName}`, error);
      // Return fallback template
      return await this.loadTemplate('general');
    }
  }

  /**
   * Load base template
   * @returns {Promise<string>} Base template content
   */
  async loadBaseTemplate() {
    if (this.templateCache.has('base')) {
      return this.templateCache.get('base');
    }

    try {
      const basePath = path.join(this.templatesPath, 'base.html');
      const baseContent = await fs.readFile(basePath, 'utf8');
      this.templateCache.set('base', baseContent);
      return baseContent;
    } catch (error) {
      console.error('Failed to load base email template', error);
      throw new Error('Email template system not available');
    }
  }

  /**
   * Replace template variables with actual values
   * @param {string} template - Template content
   * @param {Object} data - Data to replace in template
   * @returns {string} Processed template
   */
  processTemplate(template, data) {
    let processed = template;

    // Simple template variable replacement
    Object.keys(data).forEach(key => {
      const value = data[key] || '';
      const regex = new RegExp(`{{${key}}}`, 'g');
      processed = processed.replace(regex, value);
    });

    // Handle conditional blocks (simple implementation)
    // {{#if variable}} content {{/if}}
    Object.keys(data).forEach(key => {
      const value = data[key];
      const ifRegex = new RegExp(`{{#if ${key}}}([\\s\\S]*?){{\/if}}`, 'g');
      
      if (value) {
        processed = processed.replace(ifRegex, '$1');
      } else {
        processed = processed.replace(ifRegex, '');
      }
    });

    // Clean up any remaining template variables
    processed = processed.replace(/{{[^}]+}}/g, '');

    return processed;
  }

  /**
   * Get template configuration based on type
   * @param {string} templateType - Type of email template
   * @returns {Object} Template configuration
   */
  getTemplateConfig(templateType) {
    const configs = {
      [EMAIL_TEMPLATE_TYPES.PROJECT_STATUS_CHANGE]: {
        headerColor: '#2196f3',
        buttonColor: '#2196f3',
        highlightColor: '#2196f3',
        headerTitle: 'Project Status Update',
        headerSubtitle: 'Your project status has been updated'
      },
      [EMAIL_TEMPLATE_TYPES.NEW_ASSIGNMENT]: {
        headerColor: '#4caf50',
        buttonColor: '#4caf50',
        highlightColor: '#4caf50',
        headerTitle: 'New Project Assignment',
        headerSubtitle: 'You have been assigned to supervise a new project'
      },
      [EMAIL_TEMPLATE_TYPES.SYSTEM_ANNOUNCEMENT]: {
        headerColor: '#ff9800',
        buttonColor: '#ff9800',
        highlightColor: '#ff9800',
        headerTitle: 'System Announcement',
        headerSubtitle: 'Important information from the system'
      },
      [EMAIL_TEMPLATE_TYPES.GENERAL]: {
        headerColor: '#666',
        buttonColor: '#666',
        highlightColor: '#666',
        headerTitle: 'Notification',
        headerSubtitle: 'You have a new notification'
      }
    };

    return configs[templateType] || configs[EMAIL_TEMPLATE_TYPES.GENERAL];
  }

  /**
   * Get status color based on project status
   * @param {string} status - Project status
   * @returns {string} Status color
   */
  getStatusColor(status) {
    const normalizedStatus = status?.toLowerCase().replace('-', '_');
    return STATUS_COLORS[normalizedStatus?.toUpperCase()] || STATUS_COLORS.DEFAULT;
  }

  /**
   * Generate complete email HTML
   * @param {string} templateType - Type of email template
   * @param {Object} data - Template data
   * @returns {Promise<string>} Complete HTML email
   */
  async generateEmail(templateType, data) {
    try {
      // Load base and content templates
      const baseTemplate = await this.loadBaseTemplate();
      const contentTemplate = await this.loadTemplate(templateType);
      
      // Get template configuration
      const config = this.getTemplateConfig(templateType);
      
      // Process content template
      const processedContent = this.processTemplate(contentTemplate, {
        ...data,
        statusColor: this.getStatusColor(data.newStatus)
      });
      
      // Merge with base template
      const emailData = {
        ...config,
        title: data.subject || config.headerTitle,
        content: processedContent,
        statusBackgroundColor: data.newStatus ? `${this.getStatusColor(data.newStatus)}20` : 'transparent',
        statusColor: this.getStatusColor(data.newStatus),
        ...data
      };
      
      return this.processTemplate(baseTemplate, emailData);
    } catch (error) {
      console.error('Failed to generate email:', error);
      // Return simple fallback
      return this.generateFallbackEmail(data);
    }
  }

  /**
   * Generate fallback email when template system fails
   * @param {Object} data - Email data
   * @returns {string} Simple HTML email
   */
  generateFallbackEmail(data) {
    return `
      <!DOCTYPE html>
      <html>
      <head>
        <meta charset="utf-8">
        <title>${data.subject || 'Notification'}</title>
      </head>
      <body style="font-family: Arial, sans-serif; line-height: 1.6; color: #333; max-width: 600px; margin: 0 auto; padding: 20px;">
        <div style="background-color: #f8f9fa; padding: 30px; border-radius: 10px; margin: 20px 0;">
          <h2 style="color: #333; margin-top: 0;">Hello ${data.userName || 'User'}!</h2>
          <div style="margin-bottom: 20px;">
            ${data.message || 'You have a new notification from the Project Management System.'}
          </div>
        </div>
      </body>
      </html>
    `;
  }

  /**
   * Send email notification
   * @param {string} email - Recipient email
   * @param {string} subject - Email subject
   * @param {Object} templateData - Template data
   * @param {string} templateType - Template type
   * @returns {Promise<void>}
   */
  async sendEmail(email, subject, templateData, templateType = EMAIL_TEMPLATE_TYPES.GENERAL) {
    try {
      const html = await this.generateEmail(templateType, {
        ...templateData,
        subject
      });

      const emailData = {
        to: [email],
        message: {
          subject,
          html
        },
        createdAt: Timestamp.now()
      };

      await addDoc(mail, emailData);
      console.log(`✉️ Email notification queued for ${email} with template: ${templateType}`);

    } catch (error) {
      console.error('Error sending email notification:', error);
      throw error;
    }
  }

  /**
   * Clear template cache (useful for development)
   */
  clearCache() {
    this.templateCache.clear();
    console.log('📧 Email template cache cleared');
  }
}

// Export singleton instance
export default new EmailService();
