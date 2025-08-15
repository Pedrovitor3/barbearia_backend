import { Entity, PrimaryGeneratedColumn, Column } from 'typeorm';

@Entity('horarios_trabalho')
export class HorarioTrabalho {
    @PrimaryGeneratedColumn({ name: 'horarios_trabalho_id' })
    horariosTrabalhoId!: number;

    @Column({ name: 'funcionario_id' })
    funcionarioId!: number;

    @Column({ name: 'empresa_id' })
    empresaId!: number;

    @Column({ name: 'dia_semana', type: 'int' })
    diaSemana!: number;

    @Column({ name: 'horario_inicio', type: 'time' })
    horarioInicio!: string;

    @Column({ name: 'horario_fim', type: 'time' })
    horarioFim!: string;

    @Column({ default: true })
    ativo!: boolean;

    @Column({ type: 'timestamp', name: 'created_at', default: () => 'CURRENT_TIMESTAMP' })
    createdAt!: Date;

    @Column({ type: 'timestamp', name: 'updated_at', default: () => 'CURRENT_TIMESTAMP' })
    updatedAt!: Date;

    @Column({ type: 'timestamp', name: 'deleted_at', nullable: true })
    deletedAt?: Date;
}
