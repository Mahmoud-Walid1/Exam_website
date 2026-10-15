// Ignore stale responses when a visitor changes filters during a request.
export class ExamPager {
    constructor(fetchPage, onChange) {
        this.fetchPage = fetchPage;
        this.onChange = onChange;
        this.version = 0;
        this.reset({});
    }
    reset(filters) {
        this.version++;
        this.filters = filters;
        this.exams = [];
        this.cursor = null;
        this.hasMore = true;
        this.loading = false;
        this.error = null;
        this.simpleQuery = false;
    }
    async more() {
        if (this.loading || !this.hasMore) return;
        const version = this.version;
        this.loading = true;
        this.error = null;
        this.onChange(this);
        try {
            const page = await this.fetchPage({ filters: this.filters, cursor: this.cursor, pageSize: 12, simpleQuery: this.simpleQuery });
            if (version !== this.version) return;
            const ids = new Set(this.exams.map(exam => exam.id));
            this.exams.push(...page.exams.filter(exam => !ids.has(exam.id)));
            this.cursor = page.cursor;
            this.hasMore = page.hasMore;
            this.simpleQuery = page.simpleQuery;
        } catch (error) {
            if (version !== this.version) return;
            this.error = error;
        } finally {
            if (version === this.version) {
                this.loading = false;
                this.onChange(this);
            }
        }
    }
}
