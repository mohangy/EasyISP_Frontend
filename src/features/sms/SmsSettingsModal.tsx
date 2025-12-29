import { Modal } from '../../components/ui/Modal';
import { SmsSettingsForm } from './SmsSettingsForm';

interface SmsSettingsModalProps {
    isOpen: boolean;
    onClose: () => void;
    onSave?: () => void;
}

export function SmsSettingsModal({ isOpen, onClose, onSave }: SmsSettingsModalProps) {
    return (
        <Modal isOpen={isOpen} onClose={onClose} title="SMS Provider Settings">
            <SmsSettingsForm
                onSave={() => {
                    onSave?.();
                    onClose();
                }}
                onCancel={onClose}
            />
        </Modal>
    );
}
