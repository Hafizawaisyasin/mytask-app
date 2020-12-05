const express = require("express");
const multer = require("multer");
const sharp = require("sharp");
const User = require("../models/user");
const { sendWelcomeEmail, sendCancelEmail } = require("../emails/account");
const auth = require("../middleware/auth");

const router = new express.Router();
//public route only signup and login
router.post("/users", async (req, res) => {
	const user = new User(req.body);

	try {
		await user.save();
		sendWelcomeEmail(user.email, user.name);
		const token = await user.generateAuthToken();

		res.status(201).send({ user, token });
	} catch (e) {
		res.status(400).send(e);
	}
});
//for loging
router.post("/users/login", async (req, res) => {
	try {
		const user = await User.findByCredentials(req.body.email, req.body.password);
		const token = await user.generateAuthToken();
		res.send({ user, token });
	} catch (e) {
		res.status(400).send();
	}
});
//loging out
router.post("/users/logout", auth, async (req, res) => {
	try {
		req.user.tokens = req.user.tokens.filter((token) => {
			return token.token !== req.token;
		});
		await req.user.save();

		res.send();
	} catch (error) {
		res.status(500).send();
	}
});

//logout from all the sessions
router.post("/users/logoutAll", auth, async (req, res) => {
	try {
		req.user.tokens = [];
		await req.user.save();

		res.send();
	} catch (error) {
		res.status(500).send();
	}
});

// router.get("/users", async (req, res) => {
// 	try {
// 		const users = await User.find({});
// 		res.send(users);
// 	} catch (e) {
// 		res.status(500).send();
// 	}
// });
router.get("/users/me", auth, async (req, res) => {
	res.send(req.user);
});
// router.get("/users/:id", async (req, res) => {
// 	const _id = req.params.id;

// 	try {
// 		const user = await User.findById(_id);

// 		if (!user) {
// 			return res.status(404).send();
// 		}

// 		res.send(user);
// 	} catch (e) {
// 		res.status(500).send();
// 	}
// });

router.patch("/users/me", auth, async (req, res) => {
	const updates = Object.keys(req.body);
	const allowedUpdates = ["name", "email", "password", "age"];
	const isValidOperation = updates.every((update) => allowedUpdates.includes(update));

	if (!isValidOperation) {
		return res.status(400).send({ error: "Invalid updates!" });
	}

	try {
		//const user = await User.findById(req.user);

		updates.forEach((update) => (req.user[update] = req.body[update]));
		await req.user.save();

		//	if (!user) {
		//		return res.status(404).send();
		//	}

		res.send(req.user);
	} catch (e) {
		res.status(400).send(e);
	}
});

router.delete("/users/me", auth, async (req, res) => {
	try {
		// const user = await User.findByIdAndDelete(req.user._id);

		// if (!user) {
		// 	return res.status(404).send();
		// }
		await req.user.remove();
		sendCancelEmail(req.user.email, req.user.name);

		res.send(req.user);
	} catch (e) {
		res.status(500).send();
	}
});
//for uploading the profile picture
const upload = multer({
	limits: {
		fileSize: 1000000,
	},
	fileFilter(req, file, cb) {
		if (!file.originalname.match(/\.(png|jpeg|jpg)$/)) {
			return cb(new Error("please upload the image file"));
		}
		cb(undefined, true);

		// cb(new Error("File must be a pdf"));
		// cb(undefined, true);
		// cb(undefined, false);
	},
});

router.post(
	"/users/me/avatar",
	auth,
	upload.single("avatar"),
	async (req, res) => {
		const buffer = await sharp(req.file.buffer).resize({ width: 250, height: 250 }).png().toBuffer();
		req.user.avatar = buffer;

		await req.user.save();

		res.send();
	},
	(error, req, res, next) => {
		res.status(400).send({ error: error.message });
	}
);
//delete picture
router.delete("/users/me/avatar", auth, async (req, res) => {
	req.user.avatar = undefined;
	await req.user.save();
	res.send();
});

//get
router.get("/users/:id/avatar", async (req, res) => {
	try {
		const user = await User.findById(req.params.id);

		if (!user || !user.avatar) {
			throw new Error();
		}
		res.set("content-type", "image/png");
		res.send(user.avatar);
	} catch (error) {
		res.status(400).send();
	}
});
module.exports = router;
