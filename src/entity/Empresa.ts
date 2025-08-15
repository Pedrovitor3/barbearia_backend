import { Entity, PrimaryGeneratedColumn, Column } from 'typeorm';

@Entity('empresas')
export class Empresa {
    @PrimaryGeneratedColumn({ name: 'empresa_id' })
    empresaId!: number;

    @Column({ name: 'nome_fantasia', length: 255 })
    nomeFantasia!: string;

    @Column({ length: 255 })
    slug!: string;

    @Column({ name: 'razao_social', length: 255 })
    razaoSocial!: string;

    @Column({ length: 14, unique: true })
    cnpj!: string;

    @Column({ length: 20, nullable: true })
    telefone?: string;

    @Column({ length: 255, nullable: true })
    email?: string;

    @Column({ length: 255, nullable: true })
    website?: string;

    @Column({ default: true })
    ativo!: boolean;

    @Column({ type: 'timestamp', name: 'created_at', default: () => 'CURRENT_TIMESTAMP' })
    createdAt!: Date;

    @Column({ type: 'timestamp', name: 'updated_at', default: () => 'CURRENT_TIMESTAMP' })
    updatedAt!: Date;

    @Column({ type: 'timestamp', name: 'deleted_at', nullable: true })
    deletedAt?: Date;
}
