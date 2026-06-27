export class NotificationService {
  static async sendEmail(to: string, subject: string, text: string): Promise<boolean> {
    console.log(`[Notification Service] [EMAIL] Sending to: ${to} | Subject: ${subject}`);
    console.log(`[Body] ${text}`);
    return true;
  }

  static async sendSMS(toMobile: string, message: string): Promise<boolean> {
    console.log(`[Notification Service] [SMS] Sending to: ${toMobile} | Msg: ${message}`);
    return true;
  }

  static async sendPushNotification(userId: string, title: string, body: string): Promise<boolean> {
    console.log(`[Notification Service] [PUSH] Sending to User: ${userId} | Title: ${title} | Body: ${body}`);
    return true;
  }

  static async sendWhatsApp(toMobile: string, templateName: string, variables: string[]): Promise<boolean> {
    console.log(`[Notification Service] [WHATSAPP] Sending to: ${toMobile} | Template: ${templateName} | Vars: [${variables.join(', ')}]`);
    return true;
  }
}
