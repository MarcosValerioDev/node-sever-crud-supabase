export interface BlockReasonProps {
  id: string;
  userId: string;
  reason: string;
  createdAt: Date;
}

export class BlockReasonEntity {
  readonly id: string;
  readonly userId: string;
  readonly reason: string;
  readonly createdAt: Date;

  constructor(props: BlockReasonProps) {
    this.id = props.id;
    this.userId = props.userId;
    this.reason = props.reason;
    this.createdAt = props.createdAt;
  }
}
