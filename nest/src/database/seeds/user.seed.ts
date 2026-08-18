import 'dotenv/config';

import * as bcrypt from 'bcrypt';
import dataSource from '../data-source';
import { User } from '../../users/entities/user.entity';
import { Role } from '../../common/enums/role.enum';

async function seed() {
    await dataSource.initialize();

    const userRepository = dataSource.getRepository(User);

    const email = 'admin@taskflow.com';
    const password = '123456';

    const existingUser = await userRepository.findOne({
        where: { email },
    });

    if (existingUser) {
        console.log('User already exists');
        await dataSource.destroy();
        return;
    }

    const hashedPassword = await bcrypt.hash(password, 10);

    const user = userRepository.create({
        email,
        password: hashedPassword,
        role: Role.ADMIN,
    });

    await userRepository.save(user);

    console.log('Admin user created');

    await dataSource.destroy();
}

seed().catch(async (error) => {
    console.error(error);

    if (dataSource.isInitialized) {
        await dataSource.destroy();
    }

    process.exit(1);
});