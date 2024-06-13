import { NextResponse, NextRequest } from "next/server";
import { connectMongoDB } from '@/app/lib/mongodb/mongodb';
import User from '@/app/lib/mongodb/models/user';
import Image from '@/app/lib/mongodb/models/image';

export async function GET(req: NextRequest, res: NextResponse) {
    try {
        await connectMongoDB();

        // Task 1: Count total users
        const totalUsers = await User.countDocuments();
        // console.log(`Общее количество юзеров: ${totalUsers}`);

        // Task 2: Count users per day for the last 30 days
        // console.log("Количество юзеров по дням:");
        
        const startDate = new Date();
        startDate.setUTCDate(startDate.getUTCDate() - 30);
        startDate.setUTCHours(0, 0, 0, 0);

        const endDate = new Date();
        endDate.setUTCDate(endDate.getUTCDate());
        endDate.setUTCHours(23, 59, 59, 999);

        const usersPerDay = [];
        const refUsersPerDay = [];
        const generationsPerDay = [];
        const feedbackRatingsPerDay = [];
        const feedbackDetailsPerDay = [];
        const onlineUsersPerDay = [];
        const avgImagesPerOnlineUserPerDay = [];

        for (let d = new Date(startDate); d <= endDate; d.setDate(d.getDate() + 1)) {
            const startOfDay = new Date(d);
            const endOfDay = new Date(d);
            endOfDay.setDate(d.getDate() + 1);

            const query = { createdAt: { $gte: startOfDay, $lt: endOfDay } };
            const dailyUsers = await User.countDocuments(query);
            const dailyGenerations = await Image.countDocuments(query);
            const userCountUpToEndOfDay = await User.countDocuments({ createdAt: { $lt: endOfDay } });
            const avgGenerationsPerUser = userCountUpToEndOfDay > 0 ? (dailyGenerations / userCountUpToEndOfDay).toFixed(2) : 0;

            usersPerDay.push({
                date: startOfDay.toISOString().split('T')[0],
                amount: dailyUsers
            });

            generationsPerDay.push({
                date: startOfDay.toISOString().split('T')[0],
                amount: dailyGenerations,
                avgPerUser: avgGenerationsPerUser
            });

            // Task 3b: Users registered via ref link per day
            const referralsPerDay = await User.countDocuments({
                referredBy: { $ne: null },
                createdAt: { $gte: startOfDay, $lt: endOfDay }
            });

            refUsersPerDay.push({
                date: startOfDay.toISOString().split('T')[0],
                amount: referralsPerDay
            });

            // Task 8b: Average user feedback rating per day
            const dailyFeedback = await User.aggregate([
                { $match: { feedbackRating: { $ne: null }, feedbackSubmittedTime: { $gte: startOfDay, $lt: endOfDay } } },
                { $group: { _id: null, averageRating: { $avg: "$feedbackRating" }, count: { $sum: 1 } } }
            ]).exec();

            feedbackRatingsPerDay.push({
                date: startOfDay.toISOString().split('T')[0],
                averageRating: dailyFeedback.length > 0 ? dailyFeedback[0].averageRating.toFixed(2) : null,
                count: dailyFeedback.length > 0 ? dailyFeedback[0].count : 0
            });

            // Task 9: Print user feedback by day
            const dailyFeedbackDetails = await User.aggregate([
                {
                    $match: {
                        feedbackSubmittedTime: { $gte: startOfDay, $lt: endOfDay },
                        feedbackSubmitted: true
                    }
                },
                {
                    $project: {
                        date: { $dateToString: { format: "%Y-%m-%d", date: "$feedbackSubmittedTime" } },
                        feedbackRating: 1,
                        feedback1: 1,
                        feedback2: 1
                    }
                }
            ]).exec();

            feedbackDetailsPerDay.push({
                date: startOfDay.toISOString().split('T')[0],
                feedbacks: dailyFeedbackDetails
            });

            // Task 11: Online users per day
            const dailyOnlineUsers = await Image.distinct('userId', {
                createdAt: { $gte: startOfDay, $lt: endOfDay }
            });

            onlineUsersPerDay.push({
                date: startOfDay.toISOString().split('T')[0],
                amount: dailyOnlineUsers.length
            });

            // Task 12: Average amount of images generated per online user per day
            const averageImagesPerOnlineUser = dailyOnlineUsers.length > 0 ? (dailyGenerations / dailyOnlineUsers.length).toFixed(2) : 0;

            avgImagesPerOnlineUserPerDay.push({
                date: startOfDay.toISOString().split('T')[0],
                average: averageImagesPerOnlineUser
            });

            // console.log(`Дата: ${startOfDay.toISOString().split('T')[0]} - Регистрации по реферальной ссылке: ${referralsPerDay}`);
            // console.log(`Дата: ${startOfDay.toISOString().split('T')[0]} - Генерации: ${dailyGenerations}, Среднее на пользователя: ${avgGenerationsPerUser}`);
            // console.log(`Дата: ${startOfDay.toISOString().split('T')[0]} - Онлайн пользователи: ${dailyOnlineUsers.length}, Среднее количество генераций на онлайн пользователя: ${averageImagesPerOnlineUser}`);
        }

        // Task 3: Users registered via ref link
        const refUsers = await User.countDocuments({ referredBy: { $ne: null } });
        // console.log(`Количество юзеров, зарегистрированных по реферальной ссылке: ${refUsers}`);

        // Task 4: Total amount of generations
        const totalGenerations = await Image.countDocuments();
        // console.log(`Общее количество генераций: ${totalGenerations}`);

        // Task 6: Average amount of generations per user
        const avgGenerationsPerUserOverall = totalGenerations / totalUsers;
        // console.log(`Среднее количество генераций на пользователя: ${avgGenerationsPerUserOverall.toFixed(2)}`);

        // Task 8: Average user feedback rating
        const feedbackRatings = await User.aggregate([
            { $match: { feedbackRating: { $ne: null } } },
            { $group: { _id: null, averageRating: { $avg: "$feedbackRating" }, count: { $sum: 1 } } }
        ]).exec();

        const avgFeedbackRating = feedbackRatings.length > 0 ? feedbackRatings[0].averageRating.toFixed(2) : null;
        const feedbackCount = feedbackRatings.length > 0 ? feedbackRatings[0].count : 0;
        // console.log(`Средняя оценка пользователей: ${avgFeedbackRating} (на основе ${feedbackCount} отзывов)`);

        const stats = {
            totalUsers,
            usersPerDay,
            refUsers,
            refUsersPerDay,
            totalGenerations,
            avgGenerationsPerUser: avgGenerationsPerUserOverall,
            generationsPerDay,
            avgFeedbackRating,
            feedbackCount,
            feedbackRatingsPerDay,
            feedbackDetailsPerDay,
            onlineUsersPerDay,
            avgImagesPerOnlineUserPerDay
        };

        return NextResponse.json({ stats }, { status: 200 });
    } catch (error) {
        console.error('Error fetching stats:', error);

        let errorMessage = 'An error occurred';
        if (error instanceof Error) {
            errorMessage = error.message;
        } else if (typeof error === 'object' && error !== null && 'message' in error) {
            errorMessage = (error as { message: string }).message;
        }

        return NextResponse.json({ message: 'Error fetching stats', error: errorMessage }, { status: 500 });
    }
}