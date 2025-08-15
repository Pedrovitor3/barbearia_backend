import { Entity, PrimaryGeneratedColumn, Column } from 'typeorm';

@Entity('pessoa_empresas')
export class PessoaEmpresa {
    @PrimaryGeneratedColumn({ name: 'pessoa_empresa_id' })
    pessoaEmpresaId!: number;

    @Column({ name: 'pessoa_id' })
    pessoaId!: number;

    @Column({ name: 'empresa_id' })
    empresaId!: number;

    @Column({ type: 'timestamp', name: 'created_at', default: () => 'CURRENT_TIMESTAMP' })
    createdAt!: Date;

    @Column({ type: 'timestamp', name: 'updated_at', default: () => 'CURRENT_TIMESTAMP' })
    updatedAt!: Date;

    @Column({ type: 'timestamp', name: 'deleted_at', nullable: true })
    deletedAt?: Date;
}
