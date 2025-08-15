import { Entity, PrimaryGeneratedColumn, Column, ManyToOne, JoinColumn } from 'typeorm';
import { Pessoa } from './Pessoa';

@Entity('administradores')
export class Administrador {
    @PrimaryGeneratedColumn({ name: 'admin_id' })
    adminId!: number;

    @Column({ name: 'pessoa_id', unique: true })
    pessoaId!: number;

    @ManyToOne(() => Pessoa)
    @JoinColumn({ name: 'pessoa_id' })
    pessoa?: Pessoa;

    @Column({ length: 50, default: 'super' })
    nivel!: string;

    @Column({ type: 'timestamp', name: 'data_cadastro', default: () => 'CURRENT_TIMESTAMP' })
    dataCadastro!: Date;

    @Column({ default: true })
    ativo!: boolean;

    @Column({ type: 'timestamp', name: 'created_at', default: () => 'CURRENT_TIMESTAMP' })
    createdAt!: Date;

    @Column({ type: 'timestamp', name: 'updated_at', default: () => 'CURRENT_TIMESTAMP' })
    updatedAt!: Date;

    @Column({ type: 'timestamp', name: 'deleted_at', nullable: true })
    deletedAt?: Date;
}
