// ==========================================
// SUPABASE
// ==========================================

const SUPABASE_URL = "https://kxlybvehcvhnatsvfrqf.supabase.co";
const SUPABASE_KEY = "sb_publishable_bpexL-3uUyHdK6IVJK_Umw_-9jvLGwO";


const API_URL =
    `${SUPABASE_URL}/rest/v1/sensor_data` +
    `?select=id,created_at,suhu,kelembapan_udara,kelembapan_tanah,cahaya_lux,periode,kondisi_tanaman` +
    `&order=created_at.desc` +
    `&limit=1000`;


// ==========================================
// DATA
// ==========================================

let allData = [];
let filteredData = [];


// ==========================================
// GRAFIK
// ==========================================

let chartSuhu;
let chartUdara;
let chartTanah;
let chartCahaya;


// ==========================================
// ANALISIS TANAMAN
// ==========================================

function analisisTanaman(suhu, tanah, cahaya) {

    const masalah = [];

    if (tanah < 25) {
        masalah.push("Tanah terlalu kering");
    }

    if (tanah > 85) {
        masalah.push("Tanah sangat basah");
    }

    if (suhu > 32) {
        masalah.push("Suhu cukup tinggi");
    }

    if (cahaya < 20) {
        masalah.push("Cahaya rendah");
    }

    if (masalah.length === 0) {
        return "Kondisi normal";
    }

    return masalah.join(" • ");
}


// ==========================================
// FORMAT WAKTU
// ==========================================

function formatWaktu(timestamp) {

    if (!timestamp) {
        return "--";
    }

    const date = new Date(timestamp);

    return date.toLocaleString("id-ID", {
        timeZone: "Asia/Jakarta",
        day: "2-digit",
        month: "2-digit",
        year: "numeric",
        hour: "2-digit",
        minute: "2-digit",
        second: "2-digit"
    });
}


// ==========================================
// FORMAT TANGGAL WIB
// ==========================================

function formatTanggal(timestamp) {

    const date = new Date(timestamp);

    return date.toLocaleDateString("en-CA", {
        timeZone: "Asia/Jakarta"
    });
}


// ==========================================
// AMBIL DATA SUPABASE
// ==========================================

async function loadData() {

    try {

        const response = await fetch(API_URL, {

            method: "GET",

            headers: {
                "apikey": SUPABASE_KEY,
                "Authorization": `Bearer ${SUPABASE_KEY}`,
                "Content-Type": "application/json"
            }

        });


        if (!response.ok) {

            throw new Error(
                `HTTP Error: ${response.status}`
            );

        }


        const data = await response.json();


        console.log("Data Supabase:", data);


        allData = data;


        // Terapkan filter
        applyFilter();

    }

    catch (error) {

        console.error(
            "Gagal mengambil data Supabase:",
            error
        );

    }

}


// ==========================================
// FILTER DATA
// ==========================================

function applyFilter() {

    const tanggal =
        document.getElementById("filterTanggal").value;

    const periode =
        document.getElementById("filterPeriode").value;


    filteredData = allData.filter(row => {

        // ------------------------------
        // FILTER TANGGAL
        // ------------------------------

        if (tanggal) {

            const tanggalData =
                formatTanggal(row.created_at);

            if (tanggalData !== tanggal) {
                return false;
            }

        }


        // ------------------------------
        // FILTER PERIODE
        // ------------------------------

        if (
            periode !== "Semua" &&
            row.periode !== periode
        ) {

            return false;

        }


        return true;

    });


    console.log(
        "Data setelah filter:",
        filteredData
    );


    updateDashboard(filteredData);

}


// ==========================================
// UPDATE DASHBOARD
// ==========================================

function updateDashboard(data) {

    if (data.length === 0) {

        document.getElementById("suhu").textContent =
            "-- °C";

        document.getElementById("kelembapan-udara").textContent =
            "-- %";

        document.getElementById("kelembapan-tanah").textContent =
            "-- %";

        document.getElementById("cahaya").textContent =
            "-- lux";

        document.getElementById("waktu").textContent =
            "--";

        document.getElementById("periode").textContent =
            "--";

        document.getElementById("kondisi").textContent =
            "Tidak ada data";

        tampilkanRiwayat([]);

        buatGrafik([]);

        return;
    }


    // Data terbaru setelah filter
    const latest = data[0];


    // ==================================
    // SENSOR
    // ==================================

    document.getElementById("suhu").textContent =
        `${latest.suhu ?? "--"} °C`;

    document.getElementById("kelembapan-udara").textContent =
        `${latest.kelembapan_udara ?? "--"} %`;

    document.getElementById("kelembapan-tanah").textContent =
        `${latest.kelembapan_tanah ?? "--"} %`;

    document.getElementById("cahaya").textContent =
        `${latest.cahaya_lux ?? "--"} lux`;


    // ==================================
    // INFORMASI
    // ==================================

    document.getElementById("waktu").textContent =
        formatWaktu(latest.created_at);

    document.getElementById("periode").textContent =
        latest.periode ?? "--";


    // ==================================
    // KONDISI TANAMAN
    // ==================================

    document.getElementById("kondisi").textContent =
        analisisTanaman(
            Number(latest.suhu),
            Number(latest.kelembapan_tanah),
            Number(latest.cahaya_lux)
        );


    // ==================================
    // RIWAYAT
    // ==================================

    tampilkanRiwayat(data);


    // ==================================
    // GRAFIK
    // ==================================

    buatGrafik(data);

}


// ==========================================
// TABEL RIWAYAT
// ==========================================

function tampilkanRiwayat(data) {

    const table =
        document.getElementById("data-table");


    table.innerHTML = "";


    if (data.length === 0) {

        table.innerHTML = `
            <tr>
                <td colspan="6">
                    Tidak ada data untuk filter ini
                </td>
            </tr>
        `;

        return;
    }


    data.forEach(row => {

        const tr =
            document.createElement("tr");


        tr.innerHTML = `

            <td>
                ${formatWaktu(row.created_at)}
            </td>

            <td>
                ${row.suhu ?? "--"} °C
            </td>

            <td>
                ${row.kelembapan_udara ?? "--"} %
            </td>

            <td>
                ${row.kelembapan_tanah ?? "--"} %
            </td>

            <td>
                ${row.cahaya_lux ?? "--"} lux
            </td>

            <td>
                ${row.periode ?? "--"}
            </td>

        `;


        table.appendChild(tr);

    });

}


// ==========================================
// GRAFIK
// ==========================================

function buatGrafik(data) {

    const grafikData =
        [...data].reverse();


    const labels =
        grafikData.map(row => {

            const date =
                new Date(row.created_at);

            return date.toLocaleTimeString(
                "id-ID",
                {
                    timeZone: "Asia/Jakarta",
                    hour: "2-digit",
                    minute: "2-digit"
                }
            );

        });


    const suhu =
        grafikData.map(row =>
            Number(row.suhu)
        );


    const udara =
        grafikData.map(row =>
            Number(row.kelembapan_udara)
        );


    const tanah =
        grafikData.map(row =>
            Number(row.kelembapan_tanah)
        );


    const cahaya =
        grafikData.map(row =>
            Number(row.cahaya_lux)
        );


    // Hapus grafik lama
    if (chartSuhu) chartSuhu.destroy();
    if (chartUdara) chartUdara.destroy();
    if (chartTanah) chartTanah.destroy();
    if (chartCahaya) chartCahaya.destroy();


    // ======================================
    // SUHU
    // ======================================

    chartSuhu = new Chart(
        document.getElementById("chartSuhu"),
        {

            type: "line",

            data: {

                labels: labels,

                datasets: [
                    {
                        label: "Suhu (°C)",

                        data: suhu,

                        tension: 0.3,

                        fill: false
                    }
                ]

            },

            options: {

                responsive: true,

                maintainAspectRatio: false,

                scales: {

                    y: {
                        beginAtZero: false
                    }

                }

            }

        }
    );


    // ======================================
    // UDARA
    // ======================================

    chartUdara = new Chart(
        document.getElementById("chartUdara"),
        {

            type: "line",

            data: {

                labels: labels,

                datasets: [
                    {
                        label:
                            "Kelembapan Udara (%)",

                        data: udara,

                        tension: 0.3,

                        fill: false
                    }
                ]

            },

            options: {

                responsive: true,

                maintainAspectRatio: false,

                scales: {

                    y: {
                        beginAtZero: true,
                        max: 100
                    }

                }

            }

        }
    );


    // ======================================
    // TANAH
    // ======================================

    chartTanah = new Chart(
        document.getElementById("chartTanah"),
        {

            type: "line",

            data: {

                labels: labels,

                datasets: [
                    {
                        label:
                            "Kelembapan Tanah (%)",

                        data: tanah,

                        tension: 0.3,

                        fill: false
                    }
                ]

            },

            options: {

                responsive: true,

                maintainAspectRatio: false,

                scales: {

                    y: {
                        beginAtZero: true,
                        max: 100
                    }

                }

            }

        }
    );


    // ======================================
    // CAHAYA
    // ======================================

    chartCahaya = new Chart(
        document.getElementById("chartCahaya"),
        {

            type: "line",

            data: {

                labels: labels,

                datasets: [
                    {
                        label:
                            "Intensitas Cahaya (lux)",

                        data: cahaya,

                        tension: 0.3,

                        fill: false
                    }
                ]

            },

            options: {

                responsive: true,

                maintainAspectRatio: false,

                scales: {

                    y: {
                        beginAtZero: true
                    }

                }

            }

        }
    );

}


// ==========================================
// DOWNLOAD CSV
// ==========================================

function downloadCSV() {

    if (filteredData.length === 0) {

        alert(
            "Tidak ada data untuk di-download."
        );

        return;

    }


    const header = [

        "Waktu",
        "Suhu (°C)",
        "Kelembapan Udara (%)",
        "Kelembapan Tanah (%)",
        "Cahaya (lux)",
        "Periode",
        "Kondisi Tanaman"

    ];


    const rows =
        filteredData.map(row => [

            formatWaktu(row.created_at),

            row.suhu ?? "",

            row.kelembapan_udara ?? "",

            row.kelembapan_tanah ?? "",

            row.cahaya_lux ?? "",

            row.periode ?? "",

            analisisTanaman(
                Number(row.suhu),
                Number(row.kelembapan_tanah),
                Number(row.cahaya_lux)
            )

        ]);


    const csv = [

        header,

        ...rows

    ]

    .map(row =>
        row
            .map(value =>
                `"${String(value)
                    .replace(/"/g, '""')}"`
            )
            .join(",")
    )

    .join("\n");


    const blob = new Blob(
        ["\ufeff" + csv],
        {
            type:
                "text/csv;charset=utf-8;"
        }
    );


    const url =
        URL.createObjectURL(blob);


    const link =
        document.createElement("a");


    link.href = url;


    link.download =
        `mini-garden-monitoring-${new Date()
            .toISOString()
            .slice(0, 10)}.csv`;


    document.body.appendChild(link);

    link.click();

    document.body.removeChild(link);

    URL.revokeObjectURL(url);

}


// ==========================================
// EVENT FILTER
// ==========================================

document
    .getElementById("filterTanggal")
    .addEventListener(
        "change",
        applyFilter
    );


document
    .getElementById("filterPeriode")
    .addEventListener(
        "change",
        applyFilter
    );


// ==========================================
// RESET FILTER
// ==========================================

document
    .getElementById("resetFilter")
    .addEventListener(
        "click",
        () => {

            document
                .getElementById("filterTanggal")
                .value = "";

            document
                .getElementById("filterPeriode")
                .value = "Semua";

            applyFilter();

        }
    );


// ==========================================
// TOMBOL DOWNLOAD
// ==========================================

document
    .getElementById("downloadCSV")
    .addEventListener(
        "click",
        downloadCSV
    );


// ==========================================
// MULAI
// ==========================================

loadData();


// ==========================================
// AUTO REFRESH 10 DETIK
// ==========================================

setInterval(
    loadData,
    10000
);