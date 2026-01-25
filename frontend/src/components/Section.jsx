export default function Section({ title, children }) {
    return (
      <section style={styles.panel}>
        {title ? <h3 style={styles.title}>{title}</h3> : null}
        {children}
      </section>
    );
  }
  
  const styles = {
    panel: {
      marginTop: 16,
      maxWidth: 1100,
      marginInline: "auto",
      padding: 16,
      borderRadius: 18,
      border: "1px solid #e5e7eb",
      background: "#fafafa",
    },
    title: {
      margin: "0 0 12px",
      fontSize: 16,
    },
  };
  