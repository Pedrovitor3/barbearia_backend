import { Entity, PrimaryGeneratedColumn, Column } from 'typeorm';

@Entity('programa_fidelidade')
export class ProgramaFidelidade {
    @PrimaryGeneratedColumn({ name: 'fidelidade_id' })
    fidelidadeId!: number;

    @Column({ name: 'cliente_id' })
    clienteId!: number;

    @Column({ name: 'pontos_acumulados', type: 'int', default: 0 })
    pontosAcumulados!: number;

    @Column({ name: 'total_gasto', type: 'decimal', precision: 10, scale: 2, default: 0 })
    totalGasto!: string;

    @Column({ length: 20, default: 'bronze' })
    nivel!: string;

    @Column({ name: 'data_ultima_visita', type: 'date', nullable: true })
    dataUltimaVisita?: Date;

    @Column({ type: 'timestamp', name: 'created_at', default: () => 'CURRENT_TIMESTAMP' })
    createdAt!: Date;

    @Column({ type: 'timestamp', name: 'updated_at', default: () => 'CURRENT_TIMESTAMP' })
    updatedAt!: Date;

    @Column({ type: 'timestamp', name: 'deleted_at', nullable: true })
    deletedAt?: Date;
}
