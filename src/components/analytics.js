export const gtmEvent = (eventName, eventParams = {}) => {
  if (window && window.dataLayer) {
    window.dataLayer.push({
      event: eventName,
      ...eventParams,
    });
  }
};