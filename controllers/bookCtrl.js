const Book = require("../models/bookMdl");
const fs = require('fs');

exports.createBook = (req, res) => {
    const bookObject = JSON.parse(req.body.book);
    delete bookObject._id;
    delete bookObject._userId;

    const imagePath = `images/${req.file.filename}`;

    const book = new Book({
        ...bookObject,
        userId: req.auth.userId,
        imageUrl: `${req.protocol}://${req.get('host')}/${imagePath}`
    });

    book.save()
        .then(() => {
            res.status(201).json({ message: 'Objet enregistré !' });
        })
        .catch((error) => {
            res.status(400).json({ error });
        });
};


exports.modifyBook = (req, res) => {
    const bookObject = req.file ? {
        ...JSON.parse(req.body.book),
        imageUrl: `${req.protocol}://${req.get("host")}/images/${req.file.filename}`
    } : { ...req.body };
    delete bookObject._userId;
    Book.findOne({ _id: req.params.id })
        .then(book => {
            if (book.userId !== req.auth.userId) {
                res.status(401).json({ message: "Non autorisé à modifier ce livre." });
            } else {
                if (req.file) {
                    const filename = book.imageUrl.split("/images/")[1];
                    fs.unlink(`images/${filename}`, () => {})
                }
                Book.updateOne({ _id: req.params.id }, { ...bookObject, _id: req.params.id })
                    .then(() => res.status(201).json({ message: "Le livre a été modifié avec succès !" }))
                    .catch((error) => res.status(400).json({ error }));
            }
        })
};

exports.deleteBook = (req, res) => {
    Book.findOne({ _id: req.params.id })
        .then(book => {
            if (book.userId != req.auth.userId) {
                res.status(401).json({ message: 'Not authorized' });
            } else {
                const filename = book.imageUrl.split('/images/')[1];
                fs.unlink(`images/${filename}`, () => {
                    Book.deleteOne({ _id: req.params.id })
                        .then(() => { res.status(200).json({ message: 'Objet supprimé !' }) })
                        .catch((error) => res.status(401).json({ error }));
                });
            }
        })
        .catch((error) => {
            res.status(500).json({ error });
        });
};

exports.getOneBook = (req, res) => {
    Book.findOne({ _id: req.params.id })
        .then((book) => res.status(200).json(book))
        .catch((error) => res.status(404).json({ error }));
};

exports.getAllBooks = (req, res) => {
    Book.find()
        .then((books) => res.status(200).json(books))
        .catch((error) => res.status(400).json({ error }));
};

exports.rateBook = (req, res) => {
    const bookId = req.params.id;
    const userId = req.auth.userId;
    const rating = req.body.rating;

    Book.findById(bookId)
        .then(book => {
            if (!book) {
                return res.status(404).json({ message: "Livre non trouvé" });
            }
            const hasVoted = book.ratings.some(rating => rating.userId === userId);
            if (hasVoted) {
                return res.status(400).json({ message: "Vous avez déjà voté pour ce livre" });
            }
            book.ratings.push({ userId, grade: rating });

            const totalRatings = book.ratings.length;
            const sumRatings = book.ratings.reduce((sum, rating) => sum + rating.grade, 0);
            book.averageRating = sumRatings / totalRatings;

            book
                .save()
                .then(() => { res.status(201).json(book) })
                .catch(error => res.status(400).json({ error }));
        })
        .catch(error => { res.status(500).json({ error }) });
};

exports.getBestRating = (req, res, next) => {
    Book.find()
        .then((books) =>
            res.status(200).json(
                [...books]
                    .sort((a, b) => b.averageRating - a.averageRating)
                    .slice(0, 3)
            ))
        .catch((error) => {
            res.status(500).json({ error });
        });
};