/** Inline regional tools — allocation / submission / SG EE Listing (same-origin API). */
(function () {
  const API = {
    batchAlloc: "/api/tools/batch-allocation",
    submission: "/api/tools/generate-submission",
    sgProcess: "/api/tools/sg/eelisting/process",
  };

  function esc(s) {
    return String(s ?? "")
      .replace(/&/g, "&amp;")
      .replace(/</g, "&lt;")
      .replace(/"/g, "&quot;");
  }

  function currentUser() {
    try {
      return localStorage.getItem("ssc_operator") || "";
    } catch (_) {
      return "";
    }
  }

  function relPath(absPath) {
    if (!absPath) return "";
    const root = (window.__SSC_WORKSPACE_ROOT || "").replace(/\/$/, "");
    if (root && absPath.startsWith(root)) {
      return absPath.slice(root.length).replace(/^\//, "");
    }
    return absPath;
  }

  function downloadHref(absOrRel) {
    const rel = absOrRel.includes("/") ? relPath(absOrRel) || absOrRel : absOrRel;
    return `/api/tools/download?rel=${encodeURIComponent(rel)}`;
  }

  function setStatus(el, kind, html) {
    if (!el) return;
    el.className = `rt-status ${kind || ""}`;
    el.innerHTML = html;
  }

  function renderOutputs(outputs, extraHtml) {
    if (!outputs?.length) return extraHtml || "";
    const links = outputs
      .map((p) => {
        const name = p.split("/").pop();
        return `<a class="btn btn-sm" href="${esc(downloadHref(p))}" download>${esc(name)}</a>`;
      })
      .join(" ");
    return `${extraHtml || ""}<div class="rt-downloads">${links}</div>`;
  }

  async function postForm(url, formData) {
    const res = await fetch(url, { method: "POST", body: formData });
    const data = await res.json().catch(() => ({}));
    if (!res.ok) {
      const detail = data.detail || data.message || res.statusText;
      throw new Error(typeof detail === "string" ? detail : JSON.stringify(detail));
    }
    return data;
  }

  function initFppWorkspace(prefix, region, country) {
    const period = document.getElementById(`${prefix}Period`);
    const ledger = document.getElementById(`${prefix}Ledger`);
    const p1 = document.getElementById(`${prefix}P1`);
    const vendorMap = document.getElementById(`${prefix}VendorMap`);
    const submission = document.getElementById(`${prefix}Submission`);
    const result = document.getElementById(`${prefix}Result`);
    const btnAlloc = document.getElementById(`${prefix}BtnAlloc`);
    const btnSubmit = document.getElementById(`${prefix}BtnSubmit`);

    if (!btnAlloc || btnAlloc.dataset.bound) return;
    btnAlloc.dataset.bound = "1";
    btnSubmit.dataset.bound = "1";

    btnAlloc.addEventListener("click", async () => {
      if (!period?.value?.trim()) {
        setStatus(result, "error", "请填写账单月 YYYYMM");
        return;
      }
      if (!ledger?.files?.[0] || !p1?.files?.[0]) {
        setStatus(result, "error", "请上传台账 CSV 与 P1 人数 CSV");
        return;
      }
      const fd = new FormData();
      fd.append("period", period.value.trim());
      fd.append("region", region);
      fd.append("country", country);
      fd.append("ledger_file", ledger.files[0]);
      fd.append("headcount_file", p1.files[0]);
      if (vendorMap?.files?.[0]) fd.append("vendor_map_file", vendorMap.files[0]);
      btnAlloc.disabled = true;
      setStatus(result, "processing", "⏳ 批量分摊执行中…");
      try {
        const data = await postForm(API.batchAlloc, fd);
        const batch = data.batch || {};
        setStatus(
          result,
          "success",
          renderOutputs(
            data.outputs,
            `✅ ${esc(data.message || "分摊完成")}<br><span class="muted">供应商 ${batch.vendor_count ?? "—"} 家 · 跳过 ${batch.skipped_count ?? 0}</span>`
          )
        );
      } catch (e) {
        setStatus(result, "error", `❌ ${esc(e.message)}`);
      } finally {
        btnAlloc.disabled = false;
      }
    });

    btnSubmit.addEventListener("click", async () => {
      if (!submission?.files?.[0]) {
        setStatus(result, "error", "请上传提单 CSV");
        return;
      }
      const fd = new FormData();
      fd.append("region", region);
      fd.append("file", submission.files[0]);
      btnSubmit.disabled = true;
      setStatus(result, "processing", "⏳ 生成提单文本…");
      try {
        const data = await postForm(API.submission, fd);
        setStatus(result, "success", renderOutputs(data.outputs, `✅ ${esc(data.message || "提单已生成")}`));
      } catch (e) {
        setStatus(result, "error", `❌ ${esc(e.message)}`);
      } finally {
        btnSubmit.disabled = false;
      }
    });
  }

  function initSgWorkspace() {
    const active = document.getElementById("sgActive");
    const terminated = document.getElementById("sgTerminated");
    const lastEe = document.getElementById("sgLastEe");
    const result = document.getElementById("sgResult");
    const btn = document.getElementById("sgBtnRun");
    const preview = document.getElementById("sgOutputPreview");
    const previewName = document.getElementById("sgOutputName");

    if (!btn || btn.dataset.bound) return;
    btn.dataset.bound = "1";

    active?.addEventListener("change", () => {
      const name = active.files?.[0]?.name || "";
      const stem = name.replace(/\.xlsx$/i, "");
      const m = stem.match(/^([A-Za-z]{3,4})[_\-\s]*(?:Active|Terminated|EElisting|eelisting|Listing|EE)/i);
      const out = m ? `${m[1].toUpperCase()}_eelisting.xlsx` : "";
      if (previewName) previewName.textContent = out || "—";
      if (preview) preview.style.display = out ? "block" : "none";
    });

    btn.addEventListener("click", async () => {
      if (!active?.files?.[0] || !terminated?.files?.[0] || !lastEe?.files?.[0]) {
        setStatus(result, "error", "请选齐 Active、Terminated、上月 EE Listing 三份 xlsx");
        return;
      }
      const fd = new FormData();
      fd.append("active", active.files[0]);
      fd.append("terminated", terminated.files[0]);
      fd.append("last_ee", lastEe.files[0]);
      btn.disabled = true;
      setStatus(result, "processing", "⏳ 正在生成 EE Listing…");
      try {
        const data = await postForm(API.sgProcess, fd);
        const href = data.download_url || downloadHref(data.output_path);
        setStatus(
          result,
          "success",
          `✅ ${esc(data.message || "完成")}<br><a class="btn btn-primary btn-sm" href="${esc(href)}" download>${esc(data.output_filename || "下载")}</a>`
        );
      } catch (e) {
        setStatus(result, "error", `❌ ${esc(e.message)}`);
      } finally {
        btn.disabled = false;
      }
    });
  }

  function initRegionalTools(meta) {
    if (meta?.workspace_root) window.__SSC_WORKSPACE_ROOT = meta.workspace_root;
    initFppWorkspace("us", "US", "US");
    initFppWorkspace("ca", "CAN", "CAN");
    initSgWorkspace();
  }

  window.initRegionalTools = initRegionalTools;
})();
