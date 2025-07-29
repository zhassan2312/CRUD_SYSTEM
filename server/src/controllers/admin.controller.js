import { users, teachers, projects, getDocs } from '../config/firebase.config.js';

const getAdminStats = async (req, res) => {
    try {
        // Get all data in parallel
        const [usersSnapshot, teachersSnapshot, projectsSnapshot] = await Promise.all([
            getDocs(users),
            getDocs(teachers),
            getDocs(projects)
        ]);

        // Count total users
        const totalUsers = usersSnapshot.size;

        // Count total teachers
        const totalTeachers = teachersSnapshot.size;

        // Count total projects
        const totalProjects = projectsSnapshot.size;

        // Count unique students from projects
        const uniqueStudentEmails = new Set();
        projectsSnapshot.forEach(doc => {
            const projectData = doc.data();
            if (projectData.students && Array.isArray(projectData.students)) {
                projectData.students.forEach(student => {
                    if (student.email) {
                        uniqueStudentEmails.add(student.email.toLowerCase());
                    }
                });
            }
        });

        // Count projects by status
        let completedProjects = 0;
        let pendingProjects = 0;
        let inProgressProjects = 0;

        projectsSnapshot.forEach(doc => {
            const projectData = doc.data();
            const status = projectData.status || 'pending';
            
            switch (status) {
                case 'completed':
                    completedProjects++;
                    break;
                case 'in-progress':
                    inProgressProjects++;
                    break;
                case 'pending':
                default:
                    pendingProjects++;
                    break;
            }
        });

        const stats = {
            totalUsers,
            totalTeachers,
            totalProjects,
            uniqueStudents: uniqueStudentEmails.size,
            completedProjects,
            pendingProjects,
            inProgressProjects,
            // Additional stats
            averageStudentsPerProject: totalProjects > 0 ? (uniqueStudentEmails.size / totalProjects).toFixed(1) : 0,
            projectCompletionRate: totalProjects > 0 ? ((completedProjects / totalProjects) * 100).toFixed(1) : 0
        };

        res.status(200).json(stats);
    } catch (error) {
        console.error("Error getting admin stats:", error);
        res.status(500).json("Error getting admin stats");
    }
};

export { getAdminStats };
