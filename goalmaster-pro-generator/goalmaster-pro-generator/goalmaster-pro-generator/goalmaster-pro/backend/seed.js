const mongoose = require('mongoose');
const dotenv = require('dotenv');
const bcrypt = require('bcryptjs');
const User = require('./src/models/User');
const Prediction = require('./src/models/Prediction');

dotenv.config();

const predictions = [
    {
        homeTeam: 'Manchester United',
        awayTeam: 'Liverpool',
        league: 'Premier League',
        matchTime: new Date(new Date().setHours(15, 30, 0)),
        tipType: 'OVER_25',
        tipValue: 'Over 2.5 Goals',
        odds: 1.85,
        isVip: false,
        confidence: 4,
        featured: true
    },
    {
        homeTeam: 'Barcelona',
        awayTeam: 'Real Madrid',
        league: 'La Liga',
        matchTime: new Date(new Date().setHours(18, 0, 0)),
        tipType: 'CORRECT_SCORE',
        tipValue: '2-1',
        odds: 8.50,
        isVip: true,
        confidence: 5,
        featured: true
    },
    {
        homeTeam: 'AC Milan',
        awayTeam: 'Inter Milan',
        league: 'Serie A',
        matchTime: new Date(new Date().setHours(20, 45, 0)),
        tipType: 'BTTS',
        tipValue: 'Both Teams to Score',
        odds: 2.10,
        isVip: false,
        confidence: 4,
        featured: true
    }
];

const seedDatabase = async () => {
    try {
        await mongoose.connect(process.env.MONGODB_URI);
        console.log('Connected to MongoDB');
        
        await Prediction.deleteMany();
        await Prediction.insertMany(predictions);
        console.log(`Inserted ${predictions.length} predictions`);
        
        const adminExists = await User.findOne({ email: 'admin@goalmaster.com' });
        if (!adminExists) {
            const salt = await bcrypt.genSalt(10);
            const hashedPassword = await bcrypt.hash('Admin123!', salt);
            
            await User.create({
                name: 'Admin',
                email: 'admin@goalmaster.com',
                password: hashedPassword,
                role: 'admin'
            });
            console.log('Admin user created');
        }
        
        console.log('✅ Database seeded successfully!');
        process.exit();
    } catch (error) {
        console.error('❌ Error seeding database:', error);
        process.exit(1);
    }
};

seedDatabase();