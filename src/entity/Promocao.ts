import { Entity, PrimaryGeneratedColumn, Column } from 'typeorm';

@Entity('promocoes')
export class Promocao {
    @PrimaryGeneratedColumn({ name: 'promocao_id' })
    promocaoId!: number;

    @Column({ name: 'empresa_id' })
    empresaId!: number;

    @Column({ length: 255 })
    nome!: string;

    @Column({ type: 'text', nullable: true })
    descricao?: string;

    @Column({ name: 'tipo_desconto', length: 20, nullable: true })
    tipoDesconto?: string;

    @Column({ name: 'valor_desconto', type: 'decimal', precision: 10, scale: 2, nullable: true })
    valorDesconto?: string;

    @Column({ name: 'data_inicio', type: 'date', nullable: true })
    dataInicio?: Date;

    @Column({ name: 'data_fim', type: 'date', nullable: true })
    dataFim?: Date;

    @Column({ default: true })
    ativo!: boolean;

    @Column({ type: 'timestamp', name: 'created_at', default: () => 'CURRENT_TIMESTAMP' })
    createdAt!: Date;

    @Column({ type: 'timestamp', name: 'updated_at', default: () => 'CURRENT_TIMESTAMP' })
    updatedAt!: Date;

    @Column({ type: 'timestamp', name: 'deleted_at', nullable: true })
    deletedAt?: Date;
}
