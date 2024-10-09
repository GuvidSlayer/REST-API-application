const fs = require("fs/promises");
const path = require("path");

const contactsFilePath = path.resolve("models", "./contacts.json");

const readContactsFile = async () => {
  try {
    const data = await fs.readFile(contactsFilePath, "utf-8");
    const contacts = JSON.parse(data);
    return contacts.sort((a, b) => a.name.localeCompare(b.name));
  } catch (error) {
    return [];
  }
};

const writeContactsFile = async (contacts) => {
  try {
    await fs.writeFile(contactsFilePath, JSON.stringify(contacts, null, 2));
  } catch (error) {
    throw new Error("Error writing to contacts file");
  }
};

const listContacts = async () => {
  const contacts = await readContactsFile();
  return contacts;
};

const getContactById = async (contactId) => {
  const contacts = await readContactsFile();
  const contact = contacts.find((c) => c.id === contactId);
  if (!contact) {
    return null;
  }
  return contact;
};

const removeContact = async (contactId) => {
  const contacts = await readContactsFile();
  const index = contacts.findIndex((contact) => contact.id === contactId);
  if (index === -1) return null;
  const deletedContact = contacts.splice(index, 1)[0];
  await writeContactsFile(contacts);
  return deletedContact;
};

const addContact = async (body) => {
  const contacts = await readContactsFile();
  const existingContact = contacts.find((c) => c.email === body.email);
  if (existingContact) {
    throw new Error("Contact with this email already exists");
  }
  const newContact = { ...body, id: Date.now().toString() };
  contacts.push(newContact);
  await writeContactsFile(contacts);
  return newContact;
};

const updateContact = async (contactId, body) => {
  const contacts = await readContactsFile();
  const index = contacts.findIndex((c) => c.id === contactId);
  if (index === -1) {
    return null;
  }
  const updatedContact = { ...contacts[index], ...body };
  contacts[index] = updatedContact;
  await writeContactsFile(contacts);
  return updatedContact;
};

module.exports = {
  listContacts,
  getContactById,
  removeContact,
  addContact,
  updateContact,
};
