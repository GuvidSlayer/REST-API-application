const express = require("express");
const router = express.Router();
const Joi = require("joi");
const Contact = require("../../service/models/contact.js");

const contactSchema = Joi.object({
  name: Joi.string().required(),
  email: Joi.string().email().required(),
  phone: Joi.string()
    .pattern(/^\(\d{3}\) \d{3}-\d{4}$/)
    .required(),
  favorite: Joi.boolean(),
  owner: Joi.string() /* .required() */,
});

router.get("/contacts/", async (req, res, next) => {
  try {
    const contacts = await Contact.find({ owner: req.user });
    res.status(200).json(contacts);
  } catch (error) {
    next(error);
  }
});

router.get("/contacts/:contactId", async (req, res, next) => {
  const { contactId } = req.params;
  try {
    const contact = await Contact.findOne({
      _id: contactId,
      owner: req.user,
    });
    if (!contact) {
      res.status(404).json({ message: "Contact not found." });
      return;
    }
    res.status(200).json(contact);
  } catch (error) {
    next(error);
  }
});

router.post("/contacts/", async (req, res, next) => {
  try {
    const { error } = contactSchema.validate(req.body);
    if (error) {
      res.status(400).json({ message: "Missing required name - field." });
      return;
    }
    const newContact = new Contact({
      name: req.body.name,
      email: req.body.email,
      phone: req.body.phone,
      favorite: req.body.favorite || false,
      owner: req.user,
    });

    const savedContact = await newContact.save();

    res.status(201).json(savedContact);
  } catch (error) {
    next(error);
  }
});

router.delete("/contacts/:contactId", async (req, res, next) => {
  const { contactId } = req.params;
  try {
    const deletedContact = await Contact.findOneAndDelete({
      _id: contactId,
      owner: req.user,
    });
    if (!deletedContact) {
      res.status(404).json({ message: "Contact not found." });
      return;
    }
    res.status(200).json({ message: "Contact deleted." });
  } catch (error) {
    next(error);
  }
});

router.put("/contacts/:contactId", async (req, res, next) => {
  const { contactId } = req.params;
  try {
    const { error } = contactSchema.validate(req.body);
    if (error) {
      res.status(400).json({ message: "Missing fields." });
      return;
    }
    const updatedContact = await Contact.findOneAndUpdate(
      { _id: contactId, owner: req.body.owner },
      req.body,
      {
        new: true,
      }
    );
    if (!updatedContact) {
      res.status(404).json({ message: "Not found." });
      return;
    }
    res.status(200).json(updatedContact);
  } catch (error) {
    next(error);
  }
});

router.patch("/contacts/:contactId/favorite", async (req, res, next) => {
  const { contactId } = req.params;
  const { favorite } = req.body;

  try {
    if (favorite === undefined) {
      res.status(400).json({ message: "missing field favorite" });
    }

    const updatedContact = await Contact.findByIdAndUpdate(
      contactId,
      { favorite },
      { new: true }
    );

    if (!updatedContact) {
      res.status(404).json({ message: "Not found." });
      return;
    }

    res.status(200).json(updatedContact);
  } catch (error) {
    next(error);
  }
});

module.exports = router;
