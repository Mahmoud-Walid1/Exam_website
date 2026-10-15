// Ignore stale responses when a visitor changes filters during a request.
export class ExamPager {
    constructor(fetchPage, onChange, { matches = () => true, maxRequests = 3 } = {}) {
        this.fetchPage = fetchPage;
        this.onChange = onChange;
        this.version = 0;
        this.matches = matches;
        this.maxRequests = maxRequests;
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
        this.visibleLimit = 0;
    }
    matchingCount() { return this.exams.filter(exam => this.matches(exam, this.filters)).length; }
    get canLoadMore() { return this.hasMore || this.matchingCount() > this.visibleLimit; }
    async more() {
        if (this.loading || !this.canLoadMore) return;
        const version = this.version;
        const target = this.visibleLimit + (this.cursor === null ? 12 : 24);
        this.loading = true;
        this.error = null;
        this.onChange(this);
        try {
            for (let request = 0; request < this.maxRequests && this.hasMore && this.matchingCount() < target; request++) {
                const page = await this.fetchPage({ filters: this.filters, cursor: this.cursor, pageSize: 24, simpleQuery: this.simpleQuery });
                if (version !== this.version) return;
                const ids = new Set(this.exams.map(exam => exam.id));
                this.exams.push(...page.exams.filter(exam => !ids.has(exam.id)));
                this.cursor = page.cursor;
                this.hasMore = page.hasMore;
                this.simpleQuery = page.simpleQuery;
            }
        } catch (error) {
            if (version !== this.version) return;
            this.error = error;
        } finally {
            if (version === this.version) {
                this.visibleLimit = Math.min(target, this.matchingCount());
                this.loading = false;
                this.onChange(this);
            }
        }
    }
}
