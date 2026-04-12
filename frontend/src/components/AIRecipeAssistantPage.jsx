import PageContainer from "./PageContainer";
import Section from "./Section";
import AIRecipeAssistant from "./AIRecipeAssistant";

export default function AIRecipeAssistantPage({ onBack }) {
  return (
    <PageContainer title="AI Recipe Assistant">
      {onBack ? (
        <button
          type="button"
          onClick={onBack}
          style={styles.backBtn}
        >
          ← Back to recipes
        </button>
      ) : null}

      <Section title="Create with AI">
        <div style={styles.wrap}>
          <AIRecipeAssistant />
        </div>
      </Section>
    </PageContainer>
  );
}

const styles = {
  backBtn: {
    marginBottom: 10,
    border: "1px solid #e5e7eb",
    borderRadius: 12,
    padding: "8px 10px",
    background: "white",
    cursor: "pointer",
    fontWeight: 600,
    boxShadow: "0 1px 2px rgba(0,0,0,0.05)",
  },
  wrap: {
    maxWidth: 900,
  },
};