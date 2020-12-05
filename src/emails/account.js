const sgMail = require("@sendgrid/mail");
const myemail = "amianumair@gmail.com";

sgMail.setApiKey(process.env.SENDGRID_API_KEY);

const sendWelcomeEmail = (email, name) => {
	sgMail.send({
		to: email,
		from: myemail,
		subject: "Thanks For Joining Our Community",
		text: `Welcome to the App, ${name} , Let me Know How you get along with my app`,
	});
};
const sendCancelEmail = (email, name) => {
	sgMail.send({
		to: email,
		from: myemail,
		subject: "Yoy removed your account",
		text: `Why You are delete the account, ${name} , Let me Know `,
	});
};

module.exports = {
	sendWelcomeEmail,
	sendCancelEmail,
};
