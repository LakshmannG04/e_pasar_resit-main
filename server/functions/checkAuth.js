const { verifyToken } = require('../functions/verifyToken');

function checkAuth(acceptedAuth) {
    return async (req, res, next) => {
        //get user token from the headers
        const userToken = req.headers['authorization'];

        //check if token is provided
        if (!userToken) {
            return res.status(301).json({ status: 301, message: 'No token provided' });
        }


        //verify the token, and check if user is authorized as a seller
        try {
            const user = await verifyToken(userToken);

            //deny request if user does not have the required authorization
            if (!acceptedAuth.includes(user.userAuth)) {
                return res.status(302).json({ status: 302, message: 'User not authorized' });
            }

            req.user = user;

            next();


        } catch (err) {
            console.log('Error verifying token:', err);
            return res.status(500).json({ status: 500, message: `Error verifying token: ${err}` });
        }
    };

}

module.exports = { checkAuth };