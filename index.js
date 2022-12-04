import express from 'express';
import mongoose from 'mongoose';
import cors from 'cors';
import dotenv from 'dotenv';
import { Server } from 'socket.io';
import socket from './utils/socket.js';
import session from 'express-session';
import connectMongoDBSession from 'connect-mongodb-session';

import authRoute from './routes/auth.js';
import usersRoute from './routes/users.js';
import productsRoute from './routes/products.js';
import cartsRoute from './routes/carts.js';
import ordersRoute from './routes/orders.js';
import chatRoute from './routes/chat.js';
import commentRoute from './routes/comment.js';

const app = express();
const port = process.env.PORT || 5000;

//! Middleware
app.use(cors());
app.use(express.urlencoded({ extended: true }));
app.use(express.json());
dotenv.config();

//! API Routes
app.use('/auth', authRoute);
app.use('/users', usersRoute);
app.use('/products', productsRoute);
app.use('/carts', cartsRoute);
app.use('/orders', ordersRoute);
app.use('/chat', chatRoute);
app.use('/comment', commentRoute);

//! Handing Error
app.use((err, req, res, next) => {
	const errorStatus = err.status || 500;
	const errorMessage = err.message || 'Something went wrong!';
	return res.status(errorStatus).json({
		success: false,
		status: errorStatus,
		message: errorMessage,
		stack: err.stack,
	});
});

//! Connect-Mongodb-Session
const MongoDBStore = connectMongoDBSession(session);
const store = new MongoDBStore({
	uri: process.env.MONGODB_URI,
	collection: 'session',
});

//* Catch errors
store.on('error', (error) => {
	console.log(error);
});
store.on('connected', () => {
	console.log('Connected to mongodb-session ');
});

//* Express-Session
app.use(
	session({
		secret: 'This is a secret',
		cookie: {
			path: '/',
			httpOnly: true,
			maxAge: 1000 * 60 * 60 * 24 * 7, // 1 week
		},
		store: store,
		resave: true,
		saveUninitialized: true,
	})
);

//! Connect-Mongodb
const connect = async () => {
	try {
		await mongoose.connect(process.env.MONGODB_URI);
		console.log('Connected to mongoDB.');
	} catch (error) {
		throw error;
	}
};

const server = app.listen(port, () => {
	connect();
	console.log('Connected to backend.');
});

//! Socket.io
const io = new Server(server);
socket(io);
