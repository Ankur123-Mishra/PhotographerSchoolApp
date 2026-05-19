// src/utils/notifications.ts
import { showMessage } from 'react-native-flash-message';
import { hp } from '../assets/GlobalCss';

export  enum MessageType {
    SUCCESS = 'success',
    WARNING = 'warning',
    ERROR = 'danger',
    INFO = 'info',
    
}

export function showAlert(
    message: string,
    description?: string,
    type: MessageType = MessageType.INFO,
    duration = 2000
) {
    showMessage({
        message,
        description,
        type,
        style:{marginTop:hp(5)},
        floating:true,
        duration,
        icon: type === MessageType.SUCCESS ? 'success' : 'auto',
    });
}
