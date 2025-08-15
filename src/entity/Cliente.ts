import { Empresa } from '@/entity/Empresa';
import { Pessoa } from '@/entity/Pessoa';
import { Entity, PrimaryGeneratedColumn, Column, ManyToOne, JoinColumn } from 'typeorm';

@Entity('clientes')
export class Cliente {
    @PrimaryGeneratedColumn({ name: 'cliente_id' })
    clienteId!: number;

    @Column({ name: 'pessoa_id' })
    pessoaId!: number;

    @Column({ name: 'empresa_id' })
    empresaId!: number;

    @Column({ type: 'timestamp', name: 'data_cadastro', default: () => 'CURRENT_TIMESTAMP' })
    dataCadastro!: Date;

    @Column({ type: 'jsonb', nullable: true })
    preferencias?: object;

    @Column({ type: 'text', nullable: true })
    observacoes?: string;

    @Column({ type: 'timestamp', name: 'created_at', default: () => 'CURRENT_TIMESTAMP' })
    createdAt!: Date;

    @Column({ type: 'timestamp', name: 'updated_at', default: () => 'CURRENT_TIMESTAMP' })
    updatedAt!: Date;

    @Column({ type: 'timestamp', name: 'deleted_at', nullable: true })
    deletedAt?: Date;

    @ManyToOne(() => Pessoa)
    @JoinColumn({ name: 'pessoa_id' })
    pessoa?: Pessoa;

    @ManyToOne(() => Empresa)
    @JoinColumn({ name: 'empresa_id' })
    empresa?: Empresa;
}
