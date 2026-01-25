export default function PageContainer({ title, children }) {
    return (
      <div style={styles.container}>
        {title ? <h2 style={styles.title}>{title}</h2> : null}
        {children}
      </div>
    );
  }
  
  const styles = {
    container: {
      maxWidth: 1100,
      margin: "40px auto",
      padding: "0 16px",
    },
    title: {
      margin: "0 0 16px",
    },
  };
  