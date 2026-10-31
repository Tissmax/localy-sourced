/*
https://docs.nestjs.com/providers#services
*/

import { UserAccountCreationDto, UserConnectionDto, UserResponseDto } from '@app/contracts/dto/user';
import { User } from '@app/entities/user.entity';
import { Injectable } from '@nestjs/common';
import { RpcException } from '@nestjs/microservices';
import * as argon2 from 'argon2';
import { UsersRepository } from './users.repository';

@Injectable()
export class UsersService {
    // Hash factice, calculé une fois : sert à égaliser le temps de réponse (voir login)
    private readonly dummyHash = argon2.hash('mot-de-passe-factice');

    constructor(private readonly usersRepository: UsersRepository) {}

    async save(dto: UserAccountCreationDto): Promise<UserResponseDto> {
        const { password, ...rest } = dto;
        const passwordHash = await argon2.hash(password);
        const user = await this.usersRepository.save({ ...rest, passwordHash });
        return this.toResponse(user);
    }

    async login({ email, password }: UserConnectionDto): Promise<UserResponseDto> {
        const user = await this.usersRepository.findByEmailWithPassword(email);

        // On compare toujours un hash, même si l'email n'existe pas :
        // sinon le temps de réponse révèle quels emails sont inscrits
        const hash = user?.passwordHash ?? (await this.dummyHash);
        const valid = await argon2.verify(hash, password).catch(() => false);

        if (!user || !valid) {
            // Même message dans les deux cas : on ne dit pas lequel est faux
            throw new RpcException({ status: 401, message: 'Identifiants invalides' });
        }

        return this.toResponse(user);
    }

    async update(id: string, dto: Partial<UserAccountCreationDto>): Promise<UserResponseDto> {
        const { password, ...rest } = dto;
        const passwordHash = password ? await argon2.hash(password) : undefined;
        const updateData = password ? { ...rest, passwordHash } : rest;
        await this.usersRepository.update(id, updateData);
        const user = await this.usersRepository.findById(id);
        if (!user) throw new RpcException({ status: 404, message: 'Utilisateur introuvable' });
        return this.toResponse(user);
    }

    async findByEmail(email: string): Promise<UserResponseDto | null> {
        const user = await this.usersRepository.findByEmail(email);
        if (!user) throw new RpcException({ status: 404, message: 'Utilisateur introuvable' });
        return this.toResponse(user);
    }

    async delete(id: string): Promise<void> {
        return this.usersRepository.delete(id).then(() => undefined);
    }

    // Supression du mot de passe dans la réponse
    private toResponse(user: User): UserResponseDto {
        const {passwordHash, ...safeUser} = user;
        return safeUser;
    }
}