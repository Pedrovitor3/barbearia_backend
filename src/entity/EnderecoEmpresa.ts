import { Entity, PrimaryGeneratedColumn, Column } from 'typeorm';

@Entity('enderecos_empresas')
export class EnderecoEmpresa {
    @PrimaryGeneratedColumn({ name: 'endereco_empresa_id' })
    enderecoEmpresaId!: number;

    @Column({ name: 'empresa_id' })
    empresaId!: number;

    @Column({ name: 'endereco_id' })
    enderecoId!: number;

    @Column({ length: 20 })
    tipo!: 'sede' | 'filial';

    @Column({ type: 'timestamp', name: 'created_at', default: () => 'CURRENT_TIMESTAMP' })
    createdAt!: Date;

    @Column({ type: 'timestamp', name: 'updated_at', default: () => 'CURRENT_TIMESTAMP' })
    updatedAt!: Date;

    @Column({ type: 'timestamp', name: 'deleted_at', nullable: true })
    deletedAt?: Date;
}
