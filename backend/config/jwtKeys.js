import dotenv from 'dotenv';
dotenv.config();

const current = process.env.JWT_SECRET_CURRENT;
const previous = process.env.JWT_SECRET_PREVIOUS?.split(',') || [];
const access = process.env.JWT_SECRET_CURRENT; 
const refresh = process.env.JWT_REFRESH_SECRET;



export default { current, previous, access, refresh };
