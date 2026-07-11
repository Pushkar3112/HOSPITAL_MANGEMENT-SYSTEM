const passport = require('passport');
const GoogleStrategy = require('passport-google-oauth20').Strategy;
const { prisma } = require('./database');

passport.use(new GoogleStrategy({
    clientID: process.env.GOOGLE_CLIENT_ID,
    clientSecret: process.env.GOOGLE_CLIENT_SECRET,
    callbackURL: process.env.GOOGLE_CALLBACK_URL,
    scope: ['profile', 'email'],
}, async (accessToken, refreshToken, profile, done) => {
    try {
        const email = profile.emails?.[0]?.value;
        const name = profile.displayName;
        const googleId = profile.id;
        const avatar = profile.photos?.[0]?.value;

        if (!email) {
            return done(new Error('No email from Google'), null);
        }

        // Check if user exists by googleId
        let user = await prisma.user.findFirst({ where: { googleId } });

        if (!user) {
            // Check by email
            user = await prisma.user.findUnique({ where: { email } });

            if (user) {
                // Link Google account to existing user
                user = await prisma.user.update({
                    where: { id: user.id },
                    data: { googleId, avatar },
                });
            } else {
                // Create new user (PATIENT by default)
                user = await prisma.$transaction(async (tx) => {
                    const newUser = await tx.user.create({
                        data: {
                            name,
                            email,
                            googleId,
                            avatar,
                            phone: '',
                            passwordHash: '',
                            role: 'PATIENT',
                        },
                    });
                    await tx.patientProfile.create({
                        data: { userId: newUser.id },
                    });
                    return newUser;
                });
            }
        }

        return done(null, user);
    } catch (error) {
        return done(error, null);
    }
}));

module.exports = passport;
