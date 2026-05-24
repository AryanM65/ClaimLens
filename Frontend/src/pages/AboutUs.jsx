import { ShieldCheck, Eye, Cpu, Database, Award, Heart, Sparkles, CheckCircle2 } from 'lucide-react';

const AboutUs = () => {
  return (
    <div className="min-h-[calc(100vh-80px)] bg-background py-20 transition-all duration-300">
      <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8">
        
        {/* Hero Section */}
        <div className="text-center max-w-3xl mx-auto mb-20 animate-fadeIn">
          <div className="inline-flex items-center gap-2 px-3 py-1 bg-primary/10 border border-primary/20 rounded-full text-xs font-bold text-primary mb-6 animate-pulse">
            <Sparkles className="w-3.5 h-3.5" />
            Empowering Truth in Advertising
          </div>
          <h1 className="text-5xl font-extrabold tracking-tight text-on-surface sm:text-6xl mb-6 font-display">
            About <span className="text-primary font-display">ClaimLens</span>
          </h1>
          <p className="text-lg sm:text-xl text-on-surface-variant leading-relaxed">
            ClaimLens is a state-of-the-art AI-powered ad-auditing platform built to bring complete transparency, truthfulness, and accountability to consumer marketing media.
          </p>
        </div>

        {/* Vision & Mission Split Card */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-8 mb-20">
          <div className="bg-surface-container-lowest border border-outline-variant rounded-3xl p-8 sm:p-10 shadow-sm relative overflow-hidden group">
            <div className="absolute top-0 right-0 w-24 h-24 bg-primary/5 rounded-bl-full transition-all group-hover:scale-110"></div>
            <div className="h-12 w-12 rounded-xl bg-primary/10 flex items-center justify-center text-primary mb-6">
              <Eye className="w-6 h-6" />
            </div>
            <h3 className="text-2xl font-bold text-on-surface mb-4 font-display">Our Vision</h3>
            <p className="text-on-surface-variant text-sm sm:text-base leading-relaxed">
              We envision a digital media ecosystem where consumers are immune to visual deception, misleading disclaimers, and exaggerated scientific claims. By standardizing truth scoring, we aim to encourage honest product descriptions and restore trust between honest brands and their audiences.
            </p>
          </div>

          <div className="bg-surface-container-lowest border border-outline-variant rounded-3xl p-8 sm:p-10 shadow-sm relative overflow-hidden group">
            <div className="absolute top-0 right-0 w-24 h-24 bg-primary/5 rounded-bl-full transition-all group-hover:scale-110"></div>
            <div className="h-12 w-12 rounded-xl bg-primary/10 flex items-center justify-center text-primary mb-6">
              <Award className="w-6 h-6" />
            </div>
            <h3 className="text-2xl font-bold text-on-surface mb-4 font-display">Our Mission</h3>
            <p className="text-on-surface-variant text-sm sm:text-base leading-relaxed">
              Our mission is to democratize factual verification. We leverage multi-modal AI systems to automatically transcribe speech, extract OCR text, catalog framing visual tactics, and cross-reference assertions against dynamic search indices—delivering instant, independent credibility reports to anyone.
            </p>
          </div>
        </div>

        {/* Core Pillars Grid */}
        <div className="mb-20">
          <div className="text-center max-w-xl mx-auto mb-12">
            <h2 className="text-3xl font-extrabold text-on-surface font-display mb-4">Core Technology Pillars</h2>
            <p className="text-on-surface-variant text-sm">
              How ClaimLens transforms advertising media audits through unified machine learning frameworks.
            </p>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
            <div className="bg-surface-container-low border border-outline-variant/60 rounded-2xl p-6 shadow-sm hover:border-primary/30 transition-all">
              <div className="h-10 w-10 rounded-lg bg-primary/10 flex items-center justify-center text-primary mb-4 font-bold">
                01
              </div>
              <h4 className="font-bold text-on-surface mb-2 font-display">Audio Transcribing</h4>
              <p className="text-xs text-on-surface-variant leading-relaxed">
                Processes video audio channels extracting vocal claims in English, Hindi, and colloquial Hinglish transcripts cleanly.
              </p>
            </div>

            <div className="bg-surface-container-low border border-outline-variant/60 rounded-2xl p-6 shadow-sm hover:border-primary/30 transition-all">
              <div className="h-10 w-10 rounded-lg bg-primary/10 flex items-center justify-center text-primary mb-4 font-bold">
                02
              </div>
              <h4 className="font-bold text-on-surface mb-2 font-display">OCR Text Scan</h4>
              <p className="text-xs text-on-surface-variant leading-relaxed">
                Scans frames for hidden fine-print disclaimers, checking text sizes and contrasts designed to deceive.
              </p>
            </div>

            <div className="bg-surface-container-low border border-outline-variant/60 rounded-2xl p-6 shadow-sm hover:border-primary/30 transition-all">
              <div className="h-10 w-10 rounded-lg bg-primary/10 flex items-center justify-center text-primary mb-4 font-bold">
                03
              </div>
              <h4 className="font-bold text-on-surface mb-2 font-display">Frame Scanner</h4>
              <p className="text-xs text-on-surface-variant leading-relaxed">
                Applies Gemini vision analytics checking for tricks like dynamic zoom, product staging, or biased camera angles.
              </p>
            </div>

            <div className="bg-surface-container-low border border-outline-variant/60 rounded-2xl p-6 shadow-sm hover:border-primary/30 transition-all">
              <div className="h-10 w-10 rounded-lg bg-primary/10 flex items-center justify-center text-primary mb-4 font-bold">
                04
              </div>
              <h4 className="font-bold text-on-surface mb-2 font-display">Dispute Resolution</h4>
              <p className="text-xs text-on-surface-variant leading-relaxed">
                Allows verified truth organizations to raise correction requests to build a cooperative and fair fact-checking board.
              </p>
            </div>
          </div>
        </div>

        {/* Commitment / values Section */}
        <div className="bg-gradient-to-r from-primary/10 to-surface-container border border-primary/20 rounded-3xl p-8 sm:p-12 shadow-md flex flex-col md:flex-row md:items-center md:justify-between gap-8">
          <div className="space-y-4 max-w-2xl">
            <div className="flex items-center gap-2">
              <Heart className="w-5 h-5 text-primary animate-bounce" />
              <h3 className="text-2xl font-bold text-primary font-display">Our Commitment to Fairness</h3>
            </div>
            <p className="text-sm text-on-surface-variant leading-relaxed">
              We understand that context is everything. ClaimLens combines programmatic AI search indexing with live community reviews and official disputes to ensure every credibility rating is thoroughly vetted, unbiased, and completely accurate.
            </p>
            <div className="flex flex-wrap gap-4 pt-2">
              <span className="inline-flex items-center gap-1.5 text-xs text-on-surface-variant font-medium">
                <CheckCircle2 className="w-4 h-4 text-emerald-600" />
                Unbiased Fact-Checking
              </span>
              <span className="inline-flex items-center gap-1.5 text-xs text-on-surface-variant font-medium">
                <CheckCircle2 className="w-4 h-4 text-emerald-600" />
                Verified Sources First
              </span>
            </div>
          </div>

          <div className="flex-shrink-0">
            <div className="h-28 w-28 rounded-2xl bg-surface-container-lowest border border-outline-variant/80 shadow-inner flex items-center justify-center text-primary">
              <ShieldCheck className="h-16 w-16" />
            </div>
          </div>
        </div>

      </div>
    </div>
  );
};

export default AboutUs;
