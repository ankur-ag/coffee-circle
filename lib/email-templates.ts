export function bookingConfirmationHTML(details: {
    userName: string;
    eventDate: string;
    eventTime: string;
    locationName: string;
    locationAddress: string;
    locationCity: string;
    shouldRevealLocation?: boolean;
}) {
    const revealLocation = details.shouldRevealLocation ?? false;
    return `
<!DOCTYPE html>
<html>
<head>
  <meta charset="utf-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>Booking Confirmation</title>
</head>
<body style="font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, 'Helvetica Neue', Arial, sans-serif; line-height: 1.6; color: #333; max-width: 600px; margin: 0 auto; padding: 20px;">
  <div style="background: linear-gradient(135deg, #667eea 0%, #764ba2 100%); padding: 30px; border-radius: 10px 10px 0 0; text-align: center;">
    <h1 style="color: white; margin: 0; font-size: 28px;">☕ Coffee Meetup Confirmed!</h1>
  </div>
  
  <div style="background: #f9fafb; padding: 30px; border-radius: 0 0 10px 10px;">
    <p style="font-size: 16px; margin-bottom: 20px;">Hi ${details.userName},</p>
    
    <p style="font-size: 16px; margin-bottom: 25px;">Great news! Your coffee meetup reservation is confirmed. We're excited to see you there!</p>
    
    <div style="background: white; padding: 20px; border-radius: 8px; border-left: 4px solid #667eea; margin-bottom: 25px;">
      <h2 style="margin-top: 0; color: #667eea; font-size: 20px;">Event Details</h2>
      <p style="margin: 10px 0;"><strong>📅 Date:</strong> ${details.eventDate}</p>
      <p style="margin: 10px 0;"><strong>🕐 Time:</strong> ${details.eventTime}</p>
      ${revealLocation ? `
      <p style="margin: 10px 0;"><strong>📍 Location:</strong> ${details.locationName}</p>
      <p style="margin: 10px 0;"><strong>🏙️ City:</strong> ${details.locationCity}</p>
      <p style="margin: 10px 0;"><strong>🗺️ Address:</strong> ${details.locationAddress}</p>
      ` : `
      <p style="margin: 10px 0;"><strong>📍 Location:</strong> Mystery Location</p>
      <p style="margin: 10px 0; color: #666; font-style: italic;">The location will be revealed closer to the event date. Check your dashboard for updates!</p>
      `}
    </div>
    
    <div style="background: #fef3c7; padding: 15px; border-radius: 8px; margin-bottom: 25px; border-left: 4px solid #f59e0b;">
      <p style="margin: 0; font-size: 14px;"><strong>💡 Tip:</strong> Arrive a few minutes early to grab your favorite spot!</p>
    </div>
    
    <p style="font-size: 14px; color: #666; margin-bottom: 20px;">Need to cancel? You can manage your reservations from your dashboard.</p>
    
    <div style="text-align: center; margin-top: 30px;">
      <a href="https://coffee.launchstack.work/dashboard" style="background: #667eea; color: white; padding: 12px 30px; text-decoration: none; border-radius: 6px; display: inline-block; font-weight: 600;">View My Reservations</a>
    </div>
  </div>
  
  <div style="text-align: center; padding: 20px; color: #999; font-size: 12px;">
    <p>Coffee Circle - Connecting coffee lovers, one meetup at a time</p>
    <p>© ${new Date().getFullYear()} Coffee Circle. All rights reserved.</p>
  </div>
</body>
</html>
  `.trim();
}

export function cancellationConfirmationHTML(details: {
    userName: string;
    eventDate: string;
    eventTime: string;
    locationName: string;
    locationCity: string;
}) {
    return `
<!DOCTYPE html>
<html>
<head>
  <meta charset="utf-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>Cancellation Confirmation</title>
</head>
<body style="font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, 'Helvetica Neue', Arial, sans-serif; line-height: 1.6; color: #333; max-width: 600px; margin: 0 auto; padding: 20px;">
  <div style="background: linear-gradient(135deg, #f59e0b 0%, #d97706 100%); padding: 30px; border-radius: 10px 10px 0 0; text-align: center;">
    <h1 style="color: white; margin: 0; font-size: 28px;">Reservation Cancelled</h1>
  </div>
  
  <div style="background: #f9fafb; padding: 30px; border-radius: 0 0 10px 10px;">
    <p style="font-size: 16px; margin-bottom: 20px;">Hi ${details.userName},</p>
    
    <p style="font-size: 16px; margin-bottom: 25px;">This confirms that your coffee meetup reservation has been cancelled.</p>
    
    <div style="background: white; padding: 20px; border-radius: 8px; border-left: 4px solid #f59e0b; margin-bottom: 25px;">
      <h2 style="margin-top: 0; color: #f59e0b; font-size: 20px;">Cancelled Event</h2>
      <p style="margin: 10px 0;"><strong>📅 Date:</strong> ${details.eventDate}</p>
      <p style="margin: 10px 0;"><strong>🕐 Time:</strong> ${details.eventTime}</p>
      <p style="margin: 10px 0;"><strong>📍 Location:</strong> ${details.locationName}</p>
      <p style="margin: 10px 0;"><strong>🏙️ City:</strong> ${details.locationCity}</p>
    </div>
    
    <p style="font-size: 16px; margin-bottom: 25px;">We hope to see you at another coffee meetup soon!</p>
    
    <div style="text-align: center; margin-top: 30px;">
      <a href="https://coffee.launchstack.work/book" style="background: #667eea; color: white; padding: 12px 30px; text-decoration: none; border-radius: 6px; display: inline-block; font-weight: 600;">Browse Upcoming Meetups</a>
    </div>
  </div>
  
  <div style="text-align: center; padding: 20px; color: #999; font-size: 12px;">
    <p>Coffee Circle - Connecting coffee lovers, one meetup at a time</p>
    <p>© ${new Date().getFullYear()} Coffee Circle. All rights reserved.</p>
  </div>
</body>
</html>
  `.trim();
}

export function reminderEmailHTML(details: {
    userName: string;
    eventDate: string;
    eventTime: string;
    locationName: string;
    locationAddress: string;
    locationCity: string;
}) {
    return `
<!DOCTYPE html>
<html>
<head>
  <meta charset="utf-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>Event Reminder</title>
</head>
<body style="font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, 'Helvetica Neue', Arial, sans-serif; line-height: 1.6; color: #333; max-width: 600px; margin: 0 auto; padding: 20px;">
  <div style="background: linear-gradient(135deg, #f59e0b 0%, #d97706 100%); padding: 30px; border-radius: 10px 10px 0 0; text-align: center;">
    <h1 style="color: white; margin: 0; font-size: 28px;">☕ Reminder: Your Coffee Meetup is Coming Up!</h1>
  </div>
  
  <div style="background: #f9fafb; padding: 30px; border-radius: 0 0 10px 10px;">
    <p style="font-size: 16px; margin-bottom: 20px;">Hi ${details.userName},</p>
    
    <p style="font-size: 16px; margin-bottom: 25px;">Just a friendly reminder that your coffee meetup is happening soon! We're looking forward to seeing you there.</p>
    
    <div style="background: white; padding: 20px; border-radius: 8px; border-left: 4px solid #f59e0b; margin-bottom: 25px;">
      <h2 style="margin-top: 0; color: #f59e0b; font-size: 20px;">Event Details</h2>
      <p style="margin: 10px 0;"><strong>📅 Date:</strong> ${details.eventDate}</p>
      <p style="margin: 10px 0;"><strong>🕐 Time:</strong> ${details.eventTime}</p>
      <p style="margin: 10px 0;"><strong>📍 Location:</strong> ${details.locationName}</p>
      <p style="margin: 10px 0;"><strong>🏙️ City:</strong> ${details.locationCity}</p>
      <p style="margin: 10px 0;"><strong>🗺️ Address:</strong> ${details.locationAddress}</p>
    </div>
    
    <div style="background: #fef3c7; padding: 15px; border-radius: 8px; margin-bottom: 25px; border-left: 4px solid #f59e0b;">
      <p style="margin: 0; font-size: 14px;"><strong>💡 Reminder:</strong> Arrive a few minutes early to grab your favorite spot and meet your coffee circle!</p>
    </div>
    
    <p style="font-size: 14px; color: #666; margin-bottom: 20px;">Can't make it? You can cancel your reservation from your dashboard.</p>
    
    <div style="text-align: center; margin-top: 30px;">
      <a href="https://coffee.launchstack.work/dashboard" style="background: #f59e0b; color: white; padding: 12px 30px; text-decoration: none; border-radius: 6px; display: inline-block; font-weight: 600;">View My Reservations</a>
    </div>
  </div>
  
  <div style="text-align: center; padding: 20px; color: #999; font-size: 12px;">
    <p>Coffee Circle - Connecting coffee lovers, one meetup at a time</p>
    <p>© ${new Date().getFullYear()} Coffee Circle. All rights reserved.</p>
  </div>
</body>
</html>
  `.trim();
}
