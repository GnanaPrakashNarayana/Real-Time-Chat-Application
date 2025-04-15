export const requestNotificationPermission = () => {
    if ("Notification" in window && Notification.permission !== "granted") {
      Notification.requestPermission();
    }
  };
  
  export const showNotification = (title, options) => {
    if ("Notification" in window && Notification.permission === "granted") {
      new Notification(title, options);
    }
  };