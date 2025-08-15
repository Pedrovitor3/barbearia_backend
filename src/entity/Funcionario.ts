import { Entity, PrimaryGeneratedColumn, Column, JoinColumn, ManyToOne } from 'typeorm';
import { Pessoa } from './Pessoa';
import { Empresa } from '@/entity/Empresa';

@Entity('funcionarios')
export class Funcionario {
    @PrimaryGeneratedColumn({ name: 'funcionario_id' })
    funcionarioId!: number;

    @Column({ name: 'pessoa_id' })
    pessoaId!: number;

    @ManyToOne(() => Pessoa)
    @JoinColumn({ name: 'pessoa_id' })
    pessoa?: Pessoa;

    @Column({ name: 'empresa_id' })
    empresaId!: number;

    @Column({ length: 100 })
    cargo!: string;

    @Column({ type: 'decimal', precision: 10, scale: 2, nullable: true })
    salario?: string;

    @Column({ type: 'date', name: 'data_admissao' })
    dataAdmissao!: Date;

    @Column({ type: 'date', name: 'data_demissao', nullable: true })
    dataDemissao?: Date;

    @Column({ default: true })
    ativo!: boolean;

    @Column({ type: 'timestamp', name: 'created_at', default: () => 'CURRENT_TIMESTAMP' })
    createdAt!: Date;

    @Column({ type: 'timestamp', name: 'updated_at', default: () => 'CURRENT_TIMESTAMP' })
    updatedAt!: Date;

    @Column({ type: 'timestamp', name: 'deleted_at', nullable: true })
    deletedAt?: Date;

    @ManyToOne(() => Empresa)
    @JoinColumn({ name: 'empresa_id' })
    empresa?: Empresa;
}
