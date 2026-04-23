// import { useEffect } from 'react';
// import { notification } from 'antd';

// export function PushNotificationListener() {
//   useEffect(() => {
//     const handlePushNotification = (event) => {
//       const { title, message, type } = event.detail;
      
//       const notificationType = type === 'error' ? 'error' : 'info';
      
//       notification[notificationType]({
//         message: title,
//         description: message,
//         placement: 'topRight',
//         duration: 5,
//       });
//     };

//     window.addEventListener('pushNotification', handlePushNotification);
//     return () => window.removeEventListener('pushNotification', handlePushNotification);
//   }, []);

//   return null;
// }
