import { Entity, PrimaryGeneratedColumn, Column } from 'typeorm';

@Entity('servicos')
export class Servico {
    @PrimaryGeneratedColumn({ name: 'servico_id' })
    servicoId!: number;

    @Column({ name: 'empresa_id' })
    empresaId!: number;

    @Column({ length: 255 })
    nome!: string;

    @Column({ type: 'text', nullable: true })
    descricao?: string;

    @Column({ name: 'duracao_minutos', type: 'int', default: 60 })
    duracaoMinutos!: number;

    @Column({ type: 'decimal', precision: 10, scale: 2 })
    preco!: string;

    @Column({ length: 100, nullable: true })
    categoria?: string;

    @Column({ default: true })
    ativo!: boolean;

    @Column({ type: 'timestamp', name: 'created_at', default: () => 'CURRENT_TIMESTAMP' })
    createdAt!: Date;

    @Column({ type: 'timestamp', name: 'updated_at', default: () => 'CURRENT_TIMESTAMP' })
    updatedAt!: Date;

    @Column({ type: 'timestamp', name: 'deleted_at', nullable: true })
    deletedAt?: Date;
}
