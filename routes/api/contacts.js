const express = require("express");
const Joi = require("joi");
const router = express.Router();

const {
  listContacts,
  getContactById,
  removeContact,
  addContact,
  updateContact,
} = require("../../models/contacts.js");

router.get("/", async (req, res, next) => {
  res.json({ message: "template message" });
});
const contactSchema = Joi.object({
  name: Joi.string().required(),
  email: Joi.string().email().required(),
  phone: Joi.string()
    .pattern(/^\(\d{3}\) \d{3}-\d{4}$/)
    .required(),
});

router.get("/:contactId", async (req, res, next) => {
  res.json({ message: "template message" });
});
router.get("/", async (req, res, next) => {
  try {
    const contacts = await listContacts();
    res.status(200).json(contacts);
  } catch (error) {
    next(error);
  }
});

router.post("/", async (req, res, next) => {
  res.json({ message: "template message" });
});
router.get("/:contactId", async (req, res, next) => {
  const { contactId } = req.params;
  try {
    const contact = await getContactById(contactId);
    if (!contact) {
      res.status(404).json({ message: "Contact not found." });
      return;
    }
    res.status(200).json(contact);
  } catch (error) {
    next(error);
  }
});

router.delete("/:contactId", async (req, res, next) => {
  res.json({ message: "template message" });
});
router.post("/", async (req, res, next) => {
  try {
    const { error } = contactSchema.validate(req.body);
    if (error) {
      res.status(400).json({ message: "Missing required name - field." });
      return;
    }
    const newContact = await addContact(req.body);
    res.status(201).json(newContact);
  } catch (error) {
    next(error);
  }
});

router.put("/:contactId", async (req, res, next) => {
  res.json({ message: "template message" });
});
router.delete("/:contactId", async (req, res, next) => {
  const { contactId } = req.params;
  try {
    const deletedContact = await removeContact(contactId);
    if (!deletedContact) {
      res.status(404).json({ message: "Contact not found." });
      return;
    }
    res.status(200).json({ message: "Contact deleted." });
  } catch (error) {
    next(error);
  }
});

module.exports = router;
router.put("/:contactId", async (req, res, next) => {
  const { contactId } = req.params;
  try {
    const { error } = contactSchema.validate(req.body);
    if (error) {
      res.status(400).json({ message: "Missing fields." });
      return;
    }
    const updatedContact = await updateContact(contactId, req.body);
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
